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
    // ── Exclusive Use block ───────────────────────────────────────────────────
    exclusive_use_enabled: false,      // section toggle
    exclusive_use_title: '',           // heading (default "Exclusive Use")
    exclusive_use_subtitle: '',        // intro line
    exclusive_use_price: '',           // e.g. "From £28,000"
    exclusive_use_subline: '',         // e.g. "Minimum 2 nights · Sleeps 40 guests"
    exclusive_use_description: '',     // body paragraph
    exclusive_use_cta_text: '',        // CTA button label
    exclusive_use_includes: [],        // string[] max 7
    // ── Venue Spaces (max 5) ──────────────────────────────────────────────────
    // Each space: id, name, type, description, capacityCeremony/Reception/Dining/Standing,
    //             indoor, covered, accessible, imgFile, img, floorPlanFile, floorPlanUrl, sortOrder
    spaces: [],
    // ── Rooms & accommodation ─────────────────────────────────────────────────
    rooms_accommodation_type: '',
    rooms_total: '',
    rooms_suites: '',
    rooms_max_guests: '',
    rooms_exclusive_use: false,
    rooms_min_stay: '',
    rooms_description: '',
    rooms_images: [],
    // ── Dining ───────────────────────────────────────────────────────────────
    dining_style: '',
    dining_chef_name: '',
    dining_in_house: false,
    dining_external: false,
    dining_menu_styles: [],
    dining_dietary: [],
    dining_drinks: [],
    dining_description: '',
    dining_menu_images: [],
    // ── Catering cards (max 3 — icon + title + description + subtext) ────────
    catering_enabled: false,
    catering_cards: [],  // [{ id, icon, title, description, subtext, sortOrder }]
    // ── Wedding Weekend day cards (max 4) ─────────────────────────────────────
    wedding_weekend_enabled: false,
    wedding_weekend_subtitle: '',
    wedding_weekend_days: [],  // [{ id, day, title, desc, sortOrder }]
    // ── On the Estate + Nearby Experiences ───────────────────────────────────
    estate_enabled: false,
    estate_items: [],  // [{ id, icon, title, status, note, sortOrder }]
    nearby_enabled: false,
    nearby_items: [],  // [{ id, icon, title, status, note, sortOrder }]
    // ── FAQ section ──────────────────────────────────────────────────────────
    faq_enabled: false,
    faq_title: '',
    faq_subtitle: '',
    faq_cta_enabled: true,
    faq_cta_headline: '',
    faq_cta_subtext: '',
    faq_cta_button_text: '',
    faq_categories: [],  // [{ id, icon, category, questions: [{id, q, a, sortOrder}], sortOrder }]
    // Hero layout style: cinematic | split | magazine | video
    // cinematic = default (5-image luxury fade transition)
    hero_layout: 'cinematic',
    hero_video_url: '',   // YouTube or Vimeo URL — required when hero_layout === 'video'
    seo_title: '',
    seo_description: '',
    seo_keywords: [],   // max 8 — used for meta keywords + AI search indexing
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
            listing_type: listing.listingType || 'venue',
            vendor_account_id: listing.vendorAccountId || null,
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
                credit_camera: '',
                location: '',
                tags: [],
                sort_order: idx,
                is_featured: false,
                alt_text: '',
                copyright: '',
                visibility: 'public',
                image_type: '',
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
                credit_camera: '',
                location: '',
                tags: [],
                sort_order: (listing.heroImageSet?.length || 0) + idx,
                is_featured: false,
                alt_text: '',
                copyright: '',
                visibility: 'public',
                image_type: '',
              })),
            ],
            hero_layout: listing.heroLayout || 'cinematic',
            hero_video_url: listing.heroVideoUrl || '',
            seo_title: listing.seoTitle || '',
            seo_description: listing.seoDescription || '',
            seo_keywords: Array.isArray(listing.seoKeywords) ? listing.seoKeywords : [],
            spaces: Array.isArray(listing.spaces) ? listing.spaces : [],
            exclusive_use_enabled: listing.exclusiveUseEnabled ?? false,
            exclusive_use_title: listing.exclusiveUseTitle || '',
            exclusive_use_subtitle: listing.exclusiveUseSubtitle || '',
            exclusive_use_price: listing.exclusiveUsePrice || '',
            exclusive_use_subline: listing.exclusiveUseSubline || '',
            exclusive_use_description: listing.exclusiveUseDescription || '',
            exclusive_use_cta_text: listing.exclusiveUseCtaText || '',
            exclusive_use_includes: Array.isArray(listing.exclusiveUseIncludes) ? listing.exclusiveUseIncludes : [],
            catering_enabled: listing.cateringEnabled ?? false,
            catering_cards: Array.isArray(listing.cateringCards) ? listing.cateringCards : [],
            wedding_weekend_enabled: listing.weddingWeekendEnabled ?? false,
            wedding_weekend_subtitle: listing.weddingWeekendSubtitle || '',
            wedding_weekend_days: Array.isArray(listing.weddingWeekendDays) ? listing.weddingWeekendDays : [],
            estate_enabled: listing.estateEnabled ?? false,
            estate_items: Array.isArray(listing.estateItems) ? listing.estateItems : [],
            nearby_enabled: listing.nearbyEnabled ?? false,
            nearby_items: Array.isArray(listing.nearbyItems) ? listing.nearbyItems : [],
            faq_enabled: listing.faqEnabled ?? false,
            faq_title: listing.faqTitle || '',
            faq_subtitle: listing.faqSubtitle || '',
            faq_cta_enabled: listing.faqCtaEnabled ?? true,
            faq_cta_headline: listing.faqCtaHeadline || '',
            faq_cta_subtext: listing.faqCtaSubtext || '',
            faq_cta_button_text: listing.faqCtaButtonText || '',
            faq_categories: Array.isArray(listing.faqCategories) ? listing.faqCategories : [],
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
        heroLayout: formData.hero_layout || 'cinematic',
        heroVideoUrl: formData.hero_video_url || '',
        seoTitle: formData.seo_title,
        seoDescription: formData.seo_description,
        seoKeywords: formData.seo_keywords || [],
        // Exclusive Use block
        exclusiveUseEnabled: formData.exclusive_use_enabled ?? false,
        exclusiveUseTitle: formData.exclusive_use_title || '',
        exclusiveUseSubtitle: formData.exclusive_use_subtitle || '',
        exclusiveUsePrice: formData.exclusive_use_price || '',
        exclusiveUseSubline: formData.exclusive_use_subline || '',
        exclusiveUseDescription: formData.exclusive_use_description || '',
        exclusiveUseCtaText: formData.exclusive_use_cta_text || '',
        exclusiveUseIncludes: formData.exclusive_use_includes || [],
        // Catering cards
        cateringEnabled: formData.catering_enabled ?? false,
        cateringCards: (formData.catering_cards || []).map((c, idx) => ({
          id: c.id, icon: c.icon || 'dining', title: c.title || '',
          description: c.description || '', subtext: c.subtext || '', sortOrder: c.sortOrder ?? idx,
        })),
        // Wedding Weekend
        weddingWeekendEnabled: formData.wedding_weekend_enabled ?? false,
        weddingWeekendSubtitle: formData.wedding_weekend_subtitle || '',
        weddingWeekendDays: (formData.wedding_weekend_days || []).map((d, idx) => ({
          id: d.id, day: (d.day || '').slice(0, 12), title: (d.title || '').slice(0, 28),
          desc: (d.desc || '').slice(0, 110), sortOrder: d.sortOrder ?? idx,
        })),
        // On the Estate + Nearby Experiences
        estateEnabled: formData.estate_enabled ?? false,
        estateItems: (formData.estate_items || []).map((it, idx) => ({
          id: it.id, icon: it.icon || 'nature', title: it.title || '',
          status: it.status || '', note: it.note || '', sortOrder: it.sortOrder ?? idx,
        })),
        nearbyEnabled: formData.nearby_enabled ?? false,
        nearbyItems: (formData.nearby_items || []).map((it, idx) => ({
          id: it.id, icon: it.icon || 'nature', title: it.title || '',
          status: it.status || '', note: it.note || '', sortOrder: it.sortOrder ?? idx,
        })),
        // FAQ
        faqEnabled: formData.faq_enabled ?? false,
        faqTitle: formData.faq_title || '',
        faqSubtitle: formData.faq_subtitle || '',
        faqCtaEnabled: formData.faq_cta_enabled ?? true,
        faqCtaHeadline: formData.faq_cta_headline || '',
        faqCtaSubtext: formData.faq_cta_subtext || '',
        faqCtaButtonText: formData.faq_cta_button_text || '',
        faqCategories: formData.faq_categories || [],
        // Venue spaces — strip File objects, keep structured data
        spaces: (formData.spaces || []).map((s, idx) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          description: s.description,
          capacityCeremony: s.capacityCeremony,
          capacityReception: s.capacityReception,
          capacityDining: s.capacityDining,
          capacityStanding: s.capacityStanding,
          indoor: s.indoor,
          covered: s.covered,
          accessible: s.accessible,
          img: s.imgFile instanceof File ? null : (s.img || ''),
          floorPlanUrl: s.floorPlanFile instanceof File ? null : (s.floorPlanUrl || ''),
          sortOrder: s.sortOrder ?? idx,
        })),
        // Rooms & accommodation
        roomsAccommodationType: formData.rooms_accommodation_type || '',
        roomsTotal: formData.rooms_total || '',
        roomsSuites: formData.rooms_suites || '',
        roomsMaxGuests: formData.rooms_max_guests || '',
        roomsExclusiveUse: formData.rooms_exclusive_use ?? false,
        roomsMinStay: formData.rooms_min_stay || '',
        roomsDescription: formData.rooms_description || '',
        roomsImages: formData.rooms_images || [],
        // Dining
        diningStyle: formData.dining_style || '',
        diningChefName: formData.dining_chef_name || '',
        diningInHouse: formData.dining_in_house ?? false,
        diningExternal: formData.dining_external ?? false,
        diningMenuStyles: formData.dining_menu_styles || [],
        diningDietary: formData.dining_dietary || [],
        diningDrinks: formData.dining_drinks || [],
        diningDescription: formData.dining_description || '',
        diningMenuImages: formData.dining_menu_images || [],
        // Contact profile
        contactProfile: formData.contact_profile || {},
        // Opening hours
        openingHoursEnabled: formData.opening_hours_enabled ?? false,
        openingHours: formData.opening_hours || {},
        // Social proof
        pressFeatures: formData.press_features || [],
        awards: formData.awards || [],
        // Visibility & meta
        visibility: formData.visibility || 'private',
        status: publishStatus,
        listingType: formData.listing_type || 'venue',
        vendorAccountId: formData.vendor_account_id || null,
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
      // Return the saved listing's ID so parent can update route
      const savedId = result?.id || listingId;
      console.log('Save complete — returning savedId:', savedId);
      return savedId || true;
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
