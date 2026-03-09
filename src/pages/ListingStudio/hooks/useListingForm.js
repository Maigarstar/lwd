import { useState, useCallback, useEffect } from 'react';
import { createListing, updateListing, fetchListingById } from '../../../services/listings';

/**
 * Custom hook for listing form state and submission
 * Handles creating and updating listings with proper error/loading states
 */
export const useListingForm = (listingId = null) => {
  const [formData, setFormData] = useState({
    listing_type: 'venue', // venue | planner | photographer | videographer | general
    vendor_account_id: null, // linked vendor account
    venue_name: '',
    slug: '',
    category: 'wedding-venues',
    destination: 'italy',
    summary: '',      // short editorial intro max 240 chars — card + page header
    description: '',
    amenities: '',
    country: '',
    region: '',
    city: '',
    postcode: '',
    address: '',
    address_line2: '',
    lat: '',
    lng: '',
    price_range: '',
    capacity: '',
    // Hero images — up to 5, first = primary
    hero_images: [],
    // Unified media pool: gallery images + videos + virtual tours
    // Replaces legacy gallery_images[] + videos[]
    media_items: [], // Array of { type: 'image'|'video'|'virtual_tour', source_type, file, url, thumbnail, title, caption, credit_name, ... }
    seo_title: '',
    seo_description: '',
    status: 'draft',
    published_at: null,
    visibility: 'private',
    // Multi-location support (max 4 total: 1 primary + 3 additional)
    additional_locations: [],
    // Listing info / sidebar card fields
    contact_profile: { photo_file: null, photo_url: '', name: '', title: '', bio: '', email: '', phone: '', whatsapp: '', response_time: '', response_rate: '', instagram: '', website: '' },
    opening_hours_enabled: false,
    opening_hours: {},
    press_features: [],
    awards: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing listing if editing
  useEffect(() => {
    if (listingId) {
      const loadListing = async () => {
        try {
          setLoading(true);
          const listing = await fetchListingById(listingId);

          // Convert database snake_case to camelCase and populate form
          setFormData({
            venue_name: listing.name || '',
            slug: listing.slug || '',
            category: listing.categorySlug || 'wedding-venues',
            destination: listing.countrySlug || 'italy',
            summary: listing.shortDescription || '',
            description: listing.description || '',
            amenities: listing.amenities || '',
            country: listing.country || '',
            region: listing.region || '',
            city: listing.city || '',
            postcode: listing.postcode || '',
            address: listing.address || '',
            address_line2: '',
            lat: listing.lat != null ? String(listing.lat) : '',
            lng: listing.lng != null ? String(listing.lng) : '',
            price_range: listing.priceLabel || '',
            capacity: listing.capacityMin || '',
            // Convert existing single heroImage to hero_images array
            hero_images: listing.heroImage ? [{
              id: 'hero-0',
              file: null,
              url: listing.heroImage,
              title: listing.heroTitle || '',
              caption: listing.heroCaption || '',
              credit_name: listing.heroCredit || '',
              sort_order: 0,
              is_primary: true,
            }] : [],
            // Build unified media_items from legacy heroImageSet + videos
            media_items: [
              ...(listing.heroImageSet || []).map((url, idx) => ({
                id: `img-${idx}`,
                type: 'image',
                source_type: 'upload',
                file: null,
                url,
                thumbnail: null,
                title: '',
                caption: '',
                description: '',
                credit_name: '',
                credit_instagram: '',
                credit_website: '',
                location: '',
                tags: [],
                sort_order: idx,
                is_featured: false,
              })),
              ...(listing.videos || []).map((video, idx) => ({
                id: `video-${idx}`,
                type: 'video',
                source_type: 'external',
                file: null,
                url: typeof video === 'string' ? video : (video.url || ''),
                thumbnail: null,
                title: typeof video === 'object' ? (video.title || '') : '',
                caption: typeof video === 'object' ? (video.caption || '') : '',
                description: '',
                credit_name: typeof video === 'object' ? (video.credit_name || '') : '',
                credit_instagram: '',
                credit_website: '',
                location: '',
                tags: [],
                sort_order: (listing.heroImageSet?.length || 0) + idx,
                is_featured: false,
              })),
            ],
            seo_title: listing.seoTitle || '',
            seo_description: listing.seoDescription || '',
            status: listing.status || 'draft',
            published_at: listing.publishedAt || null,
            visibility: listing.isHidden ? 'private' : 'public',
          });
          setHasChanges(false);
        } catch (err) {
          setError('Failed to load listing: ' + (err.message || 'Unknown error'));
          console.error('Error loading listing:', err);
        } finally {
          setLoading(false);
        }
      };

      loadListing();
    }
  }, [listingId]);

  // Handle form field changes
  const handleChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    setHasChanges(true);
    setError(null);
  }, []);

  // Generate slug from venue name
  const generateSlug = useCallback((venueName) => {
    return venueName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  // Save listing (create or update)
  const handleSave = useCallback(async (publishStatus = 'draft') => {
    try {
      setError(null);
      setLoading(true);

      // Validate required fields
      if (!formData.venue_name || !formData.venue_name.trim()) {
        setError('Venue name is required');
        setLoading(false);
        return false;
      }

      // Generate slug if not provided
      const slug = formData.slug || generateSlug(formData.venue_name);

      // Map form data to listing payload
      // Extract primary hero image URL from hero_images array
      const primaryHero  = (formData.hero_images || [])[0] || {};
      const heroImageUrl = primaryHero.file instanceof File
        ? null // TODO: handle file upload to storage
        : primaryHero.url || primaryHero.file || '';

      // Split unified media_items into gallery images and videos for the DB payload
      const mediaItems = formData.media_items || [];

      const galleryImageUrls = mediaItems
        .filter(item => item.type === 'image' && !(item.file instanceof File) && item.url)
        .sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return (a.sort_order ?? 999) - (b.sort_order ?? 999);
        })
        .map(item => item.url)
        .filter(Boolean);

      const videoUrls = mediaItems
        .filter(item => item.type === 'video' && item.url)
        .map(item => item.url)
        .filter(Boolean);

      const listingPayload = {
        name: formData.venue_name,
        slug: slug,
        categorySlug: formData.category,
        countrySlug: formData.destination,
        shortDescription: formData.summary || '',
        description: formData.description,
        amenities: formData.amenities,
        country: formData.country,
        region: formData.region,
        city: formData.city,
        postcode: formData.postcode,
        address: [formData.address, formData.address_line2].filter(Boolean).join('\n'),
        lat: formData.lat,
        lng: formData.lng,
        priceLabel: formData.price_range,
        capacityMin: formData.capacity ? parseInt(formData.capacity, 10) : null,
        heroImage: heroImageUrl,
        heroTitle: primaryHero.title || '',
        heroCaption: primaryHero.caption || '',
        heroCredit: primaryHero.credit_name || '',
        heroImageSet: galleryImageUrls,
        videos: videoUrls.map(url => ({
          url,
          title: '',
          caption: '',
        })),
        seoTitle: formData.seo_title,
        seoDescription: formData.seo_description,
        status: publishStatus,
        listingType: 'wedding-venue',
        tier: 'standard',
      };

      // Add published_at if publishing
      if (publishStatus === 'published') {
        listingPayload.publishedAt = new Date().toISOString();
      }

      let result;
      if (listingId) {
        // Update existing listing
        result = await updateListing(listingId, listingPayload);
        console.log('✓ Listing updated successfully:', result);
      } else {
        // Create new listing
        result = await createListing(listingPayload);
        console.log('✓ Listing created successfully:', result);
      }

      setHasChanges(false);
      return true;
    } catch (err) {
      console.error('Error saving listing:', err);
      setError('Failed to save listing: ' + (err.message || 'Unknown error'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, listingId, generateSlug]);

  // Save as draft
  const handleSaveDraft = useCallback(async () => {
    return handleSave('draft');
  }, [handleSave]);

  // Publish listing
  const handlePublish = useCallback(async () => {
    return handleSave('published');
  }, [handleSave]);

  return {
    formData,
    handleChange,
    handleSave,
    handleSaveDraft,
    handlePublish,
    loading,
    error,
    hasChanges,
    setError,
  };
};
