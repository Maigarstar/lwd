import { useState, useCallback, useEffect } from 'react';
import { createListing, updateListing, fetchListingById } from '../../../services/listings';

/**
 * Custom hook for listing form state and submission
 * Handles creating and updating listings with proper error/loading states
 */
export const useListingForm = (listingId = null) => {
  const [formData, setFormData] = useState({
    venue_name: '',
    slug: '',
    category: 'wedding-venues',
    destination: 'italy',
    description: '',
    amenities: '',
    country: '',
    region: '',
    address: '',
    price_range: '',
    capacity: '',
    hero_image: '',
    gallery_images: '',
    seo_title: '',
    seo_description: '',
    status: 'draft',
    published_at: null,
    visibility: 'private',
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
            description: listing.description || '',
            amenities: listing.amenities || '',
            country: listing.country || '',
            region: listing.region || '',
            address: listing.address || '',
            price_range: listing.priceLabel || '',
            capacity: listing.capacityMin || '',
            hero_image: listing.heroImage || '',
            gallery_images: listing.heroImageSet?.join('\n') || '',
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
      const listingPayload = {
        name: formData.venue_name,
        slug: slug,
        categorySlug: formData.category,
        countrySlug: formData.destination,
        description: formData.description,
        amenities: formData.amenities,
        country: formData.country,
        region: formData.region,
        address: formData.address,
        priceLabel: formData.price_range,
        capacityMin: formData.capacity ? parseInt(formData.capacity, 10) : null,
        heroImage: formData.hero_image,
        heroImageSet: formData.gallery_images
          ? formData.gallery_images.split('\n').filter(url => url.trim())
          : [],
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
