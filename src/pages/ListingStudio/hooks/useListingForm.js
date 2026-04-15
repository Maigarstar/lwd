import { useState, useCallback, useEffect } from 'react';
import { createListing, updateListing, fetchListingById, calculateContentQualityScore } from '../../../services/listings';
import { uploadPendingFiles, uploadMediaFile } from '../../../utils/storageUpload';

// ── Slugify helper: convert display names to URL-safe slugs ──────────────────
// "Somerset" → "somerset", "New York" → "new-york"
function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      // spaces → dashes
    .replace(/[^\w-]/g, '')    // remove non-word chars except dashes
    .replace(/-+/g, '-');      // collapse multiple dashes
}

// ── Country normaliser ────────────────────────────────────────────────────────
// Dropdown values are full display names ("Austria", "United Kingdom") to match
// how the DB stores the country column. Just pass through as-is.
function countryToSlug(name) {
  return name || '';
}

// ── Local snake_case → camelCase conversion ───────────────────────────────────
// fetchListingById returns raw Supabase rows (snake_case). Convert so all
// camelCase field references in the form population block below work correctly.
function snakeToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj && typeof obj === 'object' && !(obj instanceof File) && !(obj instanceof Blob)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        snakeToCamel(v),
      ])
    );
  }
  return obj;
}

/**
 * Custom hook for listing form state and submission
 * Handles creating and updating listings with proper error/loading states
 */
export const useListingForm = (listingId = null) => {
  const [formData, setFormData] = useState({
    listing_type: 'venue', // venue | planner | photographer | videographer | general
    vendor_account_id: null,   // linked vendor account
    managed_account_id: null,  // linked managed account (Social Studio client)
    venue_name: '',
    hero_tagline: '',
    slug: '',
    category: 'wedding-venues',          // primary category (= assigned_categories[0]?.slug, backwards compat)
    assigned_categories: [],             // [{ id, slug, name, parentSlug, parentName }], up to 8
    destination: 'italy',
    summary: '',      // short editorial intro max 240 chars, card + page header
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
    price_from: '',
    price_currency: '£',
    capacity: '',
    // Hero images, up to 5, first = primary
    hero_images: [],
    // Unified media pool: gallery images + videos + virtual tours
    // Replaces legacy gallery_images[] + videos[]
    media_items: [], // Array of { type: 'image'|'video'|'virtual_tour', source_type, file, url, thumbnail, title, caption, credit_name, ... }
    showcase_enabled: false,           // showcase page toggle
    showcase_category: 'venue',        // 'venue' | 'planner' | 'photographer' | 'vendor' | 'florist' | 'caterer' | 'stylist'
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
    // ── Catering cards (max 3, icon + title + description + subtext) ────────
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
    hero_video_url: '',   // YouTube or Vimeo URL, required when hero_layout === 'video'
    seo_title: '',
    seo_description: '',
    seo_keywords: [],   // max 8, used for meta keywords + AI search indexing
    status: 'draft',
    published_at: null,
    visibility: 'private',
    // Multi-location support (max 4 total: 1 primary + 3 additional)
    additional_locations: [],
    // Listing info / sidebar card fields
    contact_profile: { photo_file: null, photo_url: '', name: '', title: '', bio: '', email: '', phone: '', whatsapp: '', response_time: '', response_rate: '', instagram: '', website: '' },
    weddings_hosted: '',
    member_since: '',
    opening_hours_enabled: false,
    opening_hours: {},
    press_features: [],
    awards: [],
    // ── Editorial Content Layer (Phase 3) ─────────────────────────────────────
    hero_summary: null,
    section_intros: {
      overview: '',
      spaces: '',
      dining: '',
      rooms: '',
      art: '',
      weddings: ''
    },
    editorial_approved: false,
    editorial_fact_checked: false,
    editorial_last_reviewed_at: null,
    refresh_notes: null,
    content_quality_score: 0,
    editorial_last_reviewed_by: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(''); // e.g. "Uploading 2 of 5 images…"

  // Load existing listing if editing
  useEffect(() => {
    if (listingId) {
      const loadListing = async () => {
        try {
          setLoading(true);
          // Convert snake_case DB row → camelCase so all field references below work
          const rawFromService = await fetchListingById(listingId);

          // ── Guard: Verify fetched record matches requested ID ──
          // Prevents stale data or cross-record corruption from being loaded
          if (rawFromService.id !== listingId) {
            setError(
              `Data integrity check failed: requested listing ${listingId} ` +
              `but database returned ${rawFromService.id}. This could indicate ` +
              `a service layer issue. Refresh the page and try again.`
            );
            setLoading(false);
            return;
          }

          // Convert snake_case DB row to camelCase for form field references
          const listing = snakeToCamel(rawFromService);

          // ── hero_images: prefer rich JSONB array, fall back to legacy single heroImage ──
          const heroImagesFromDb = Array.isArray(listing.heroImages) && listing.heroImages.length > 0
            ? listing.heroImages.map((img, idx) => ({
                id: img.id || `hero-${idx}`,
                file: null,
                url: img.url || '',
                title: img.title || img.altText || '',
                caption: img.caption || listing.heroCaption || '',
                credit_name: img.creditCamera || img.creditName || listing.heroCredit || '',
                copyright: img.copyright || '',
                alt_text: img.altText || img.alt_text || '',
                show_credit: img.showCredit ?? false,
                sort_order: img.sortOrder ?? idx,
                is_primary: img.featured ?? (idx === 0),
                visibility: img.visibility || 'public',
              }))
            : listing.heroImage
              ? [{ id: 'hero-0', file: null, url: listing.heroImage, title: listing.heroTitle || '', caption: listing.heroCaption || '', credit_name: listing.heroCredit || '', sort_order: 0, is_primary: true }]
              : [];

          // ── media_items: prefer rich JSONB array, fall back to legacy heroImageSet + videos ──
          const mediaItemsFromDb = Array.isArray(listing.mediaItems) && listing.mediaItems.length > 0
            ? listing.mediaItems.map((item, idx) => ({
                id: item.id || `media-${idx}`,
                // DB stores semantic categories (hero, exterior, spa, etc.)
                // The media pool only understands: image | video | virtual_tour
                type: (item.type === 'video' || item.type === 'virtual_tour') ? item.type : 'image',
                source_type: item.sourceType || 'upload',
                file: null,
                url: item.url || '',
                thumbnail: item.thumbnail || null,
                title: item.title || '',
                caption: item.caption || '',
                description: item.description || '',
                credit_name: item.creditCamera || item.creditName || '',
                credit_instagram: item.creditInstagram || '',
                credit_website: item.creditWebsite || '',
                credit_camera: item.creditCamera || '',
                location: item.location || '',
                tags: Array.isArray(item.tags) ? item.tags : [],
                sort_order: item.sortOrder ?? idx,
                is_featured: item.featured ?? false,
                alt_text: item.altText || item.alt_text || '',
                copyright: item.copyright || '',
                visibility: item.visibility || 'public',
                image_type: item.type || '',
                show_credit: item.showCredit ?? false,
              }))
            : [
                ...(listing.heroImageSet || []).map((url, idx) => ({
                  id: `img-${idx}`, type: 'image', source_type: 'upload', file: null, url,
                  thumbnail: null, title: '', caption: '', description: '', credit_name: '',
                  credit_instagram: '', credit_website: '', credit_camera: '', location: '',
                  tags: [], sort_order: idx, is_featured: false, alt_text: '', copyright: '',
                  visibility: 'public', image_type: '', show_credit: false,
                })),
                ...(listing.videos || []).map((video, idx) => ({
                  id: `video-${idx}`, type: 'video', source_type: 'external', file: null,
                  url: typeof video === 'string' ? video : (video.url || ''),
                  thumbnail: null,
                  title: typeof video === 'object' ? (video.title || '') : '',
                  caption: typeof video === 'object' ? (video.caption || '') : '',
                  description: '', credit_name: typeof video === 'object' ? (video.credit_name || '') : '',
                  credit_instagram: '', credit_website: '', credit_camera: '', location: '', tags: [],
                  sort_order: (listing.heroImageSet?.length || 0) + idx, is_featured: false,
                  alt_text: '', copyright: '', visibility: 'public', image_type: '', show_credit: false,
                })),
              ];

          // Convert database snake_case to camelCase and populate form
          setFormData({
            listing_type: listing.listingType || 'venue',
            vendor_account_id: listing.vendorAccountId || null,
            managed_account_id: listing.managedAccountId || null,
            venue_name: listing.name || '',
            hero_tagline: listing.heroTagline || '',
            slug: listing.slug || '',
            category: listing.categorySlug || listing.category || 'wedding-venues',
            assigned_categories: Array.isArray(listing.assignedCategories) ? listing.assignedCategories : (listing.categorySlug ? [{ id: listing.categorySlug, slug: listing.categorySlug, name: listing.categorySlug, parentSlug: null, parentName: null }] : []),
            // destination: prefer countrySlug (legacy), fall back to destination column (new schema)
            destination: listing.countrySlug || listing.destination || 'italy',
            // summary: prefer shortDescription (legacy), fall back to summary column (new schema)
            summary: listing.shortDescription || listing.summary || '',
            description: listing.description || '',
            amenities: listing.amenities || '',
            country: countryToSlug(listing.country || ''),
            region: listing.regionSlug || listing.region || '',
            city: listing.citySlug || listing.city || '',
            postcode: listing.postcode || '',
            address: listing.address || '',
            address_line2: '',
            lat: listing.lat != null ? String(listing.lat) : '',
            lng: listing.lng != null ? String(listing.lng) : '',
            // price_range: prefer priceLabel (legacy), fall back to priceRange / price_range (new schema)
            price_range: listing.priceLabel || listing.priceRange || '',
            price_from: listing.priceFrom != null ? String(listing.priceFrom) : '',
            price_currency: listing.priceCurrency || '£',
            // capacity: prefer capacityMin (legacy), fall back to capacity (new schema)
            capacity: listing.capacityMin != null ? String(listing.capacityMin) : (listing.capacity || ''),
            hero_images: heroImagesFromDb,
            media_items: mediaItemsFromDb,
            hero_layout: listing.heroLayout || 'cinematic',
            hero_video_url: listing.heroVideoUrl || '',
            seo_title: listing.seoTitle || '',
            seo_description: listing.seoDescription || '',
            seo_keywords: Array.isArray(listing.seoKeywords) ? listing.seoKeywords : [],
            spaces: Array.isArray(listing.spaces) ? listing.spaces : [],
            showcase_enabled: listing.showcaseEnabled ?? false,
            showcase_category: listing.showcaseCategory || 'venue',
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
            // ── Rooms & Accommodation ─────────────────────────────────────────
            rooms_accommodation_type: listing.roomsAccommodationType || '',
            rooms_total: listing.roomsTotal || '',
            rooms_suites: listing.roomsSuites || '',
            rooms_max_guests: listing.roomsMaxGuests || '',
            rooms_exclusive_use: listing.roomsExclusiveUse ?? false,
            rooms_min_stay: listing.roomsMinStay || '',
            rooms_description: listing.roomsDescription || '',
            rooms_images: Array.isArray(listing.roomsImages) ? listing.roomsImages : [],
            // ── Dining ───────────────────────────────────────────────────────
            dining_style: listing.diningStyle || '',
            dining_chef_name: listing.diningChefName || '',
            dining_in_house: listing.diningInHouse ?? false,
            dining_external: listing.diningExternal ?? false,
            dining_menu_styles: Array.isArray(listing.diningMenuStyles) ? listing.diningMenuStyles : [],
            dining_dietary: Array.isArray(listing.diningDietary) ? listing.diningDietary : [],
            dining_drinks: Array.isArray(listing.diningDrinks) ? listing.diningDrinks : [],
            dining_description: listing.diningDescription || '',
            dining_menu_images: Array.isArray(listing.diningMenuImages) ? listing.diningMenuImages : [],
            // ── Contact Profile ───────────────────────────────────────────────
            contact_profile: listing.contactProfile && typeof listing.contactProfile === 'object'
              ? { photo_file: null, photo_url: listing.contactProfile.photoUrl || listing.contactProfile.photo_url || '', name: listing.contactProfile.name || '', title: listing.contactProfile.title || '', bio: listing.contactProfile.bio || '', email: listing.contactProfile.email || '', phone: listing.contactProfile.phone || '', whatsapp: listing.contactProfile.whatsapp || '', response_time: listing.contactProfile.responseTime || listing.contactProfile.response_time || '', response_rate: listing.contactProfile.responseRate || listing.contactProfile.response_rate || '', instagram: listing.contactProfile.instagram || '', website: listing.contactProfile.website || '' }
              : { photo_file: null, photo_url: '', name: '', title: '', bio: '', email: '', phone: '', whatsapp: '', response_time: '', response_rate: '', instagram: '', website: '' },
            weddings_hosted: listing.weddingsHosted != null ? String(listing.weddingsHosted) : '',
            member_since:    listing.memberSince    || '',
            status: listing.status || 'draft',
            published_at: listing.publishedAt || null,
            visibility: listing.isHidden ? 'private' : (listing.visibility || 'public'),
            // ── Editorial Content Layer (Phase 3) ─────────────────────────────────────
            hero_summary: listing.heroSummary || null,
            section_intros: (listing.sectionIntros && typeof listing.sectionIntros === 'object') ? listing.sectionIntros : { overview: '', spaces: '', dining: '', rooms: '', art: '', weddings: '' },
            editorial_approved: listing.editorialApproved ?? false,
            editorial_fact_checked: listing.editorialFactChecked ?? false,
            editorial_last_reviewed_at: listing.editorialLastReviewedAt || null,
            editorial_last_reviewed_by: listing.editorialLastReviewedBy || null,
            refresh_notes: listing.refreshNotes || null,
            content_quality_score: listing.contentQualityScore || 0,
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
  //
  // Accent handling: NFD-normalise first so combining diacritics split off
  // their base letter, then strip the diacritics. Without this step, `\w`
  // removes accented characters entirely (e.g. "Caïds" → "Cads"), which
  // diverges from the transliterated slug users and prior saves produce
  // (e.g. "kasbah-des-caids"). Normalising keeps accent-bearing names round-
  // trip stable with their saved slugs.
  const generateSlug = useCallback((venueName) => {
    return venueName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
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

      // Validate the slug is at least related to the venue name. We allow
      // either an exact match of the auto-generated slug OR an extension of
      // it (e.g. "orchardleigh-house-uk" for disambiguating listings of the
      // same name across countries). What we still want to catch is the
      // wholly-unrelated case (e.g. "totally-different-name").
      const expectedSlug = generateSlug(formData.venue_name);
      const slugLc = slug.toLowerCase();
      const expectedLc = expectedSlug.toLowerCase();
      const isExtension = slugLc === expectedLc || slugLc.startsWith(expectedLc + '-');
      if (!isExtension) {
        setError(
          `Slug must match the venue name pattern. ` +
          `Expected: "${expectedSlug}" (or "${expectedSlug}-<suffix>") but got "${slug}". ` +
          `The slug is auto-generated from your venue name; suffixes are allowed for disambiguation.`
        );
        setLoading(false);
        return false;
      }

      // ── Upload any pending File objects to Supabase Storage ─────────────
      // Must happen before building the payload so every item has a real URL.
      setUploadProgress('Checking for files to upload…');

      // Upload contact profile photo if a new File was selected
      let contactPhotoUrl = formData.contact_profile?.photo_url || '';
      const contactPhotoFile = formData.contact_profile?.photo_file;
      if (contactPhotoFile instanceof File) {
        try {
          setUploadProgress('Uploading contact photo…');
          const photoId = `contact-${slug}-${Date.now()}`;
          const result = await uploadMediaFile(contactPhotoFile, photoId);
          contactPhotoUrl = typeof result === 'string' ? result : result.url;
          handleChange('contact_profile', {
            ...formData.contact_profile,
            photo_file: null,
            photo_url: contactPhotoUrl,
          });
        } catch (err) {
          console.warn('[storage] Contact photo upload failed:', err.message);
        }
      }

      const [heroUpload, mediaUpload, roomsUpload, diningUpload] = await Promise.all([
        uploadPendingFiles(
          formData.hero_images || [],
          (msg) => setUploadProgress(msg)
        ),
        uploadPendingFiles(
          formData.media_items || [],
          (msg) => setUploadProgress(msg)
        ),
        uploadPendingFiles(
          formData.rooms_images || [],
          (msg) => setUploadProgress(msg)
        ),
        uploadPendingFiles(
          formData.dining_menu_images || [],
          (msg) => setUploadProgress(msg)
        ),
      ]);

      setUploadProgress('');

      // Persist uploaded URLs back into form state so the UI shows storage
      // URLs instead of blob: URLs after save (avoids re-uploading on next save)
      if (heroUpload.uploaded > 0) {
        handleChange('hero_images', heroUpload.items);
      }
      if (mediaUpload.uploaded > 0) {
        handleChange('media_items', mediaUpload.items);
      }
      if (roomsUpload.uploaded > 0) {
        handleChange('rooms_images', roomsUpload.items);
      }
      if (diningUpload.uploaded > 0) {
        handleChange('dining_menu_images', diningUpload.items);
      }

      if (heroUpload.failed > 0 || mediaUpload.failed > 0 || roomsUpload.failed > 0 || diningUpload.failed > 0) {
        console.warn(
          `[storage] ${heroUpload.failed + mediaUpload.failed + roomsUpload.failed + diningUpload.failed} file(s) failed to upload, ` +
          `they will be excluded from the saved listing.`
        );
      }

      // Use the uploaded versions for the payload
      const primaryHero  = (heroUpload.items)[0] || {};
      const heroImageUrl = primaryHero.url || '';

      // Split unified media_items into gallery images and videos for the DB payload
      const mediaItems = mediaUpload.items;

      // Strip un-serialisable File objects before including in the DB payload.
      // Items with file instanceof File (not yet uploaded to storage) have url=''
      // and are excluded from the AI index by the edge function (url must start with http).
      const cleanMediaItems = mediaItems.map(({ file: _file, ...rest }) => rest);

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
        heroTagline: formData.hero_tagline || '',
        slug: slug,
        categorySlug: formData.assigned_categories?.[0]?.slug || formData.category || 'wedding-venues',
        assignedCategories: formData.assigned_categories || [],
        countrySlug: formData.destination,
        shortDescription: formData.summary || '',
        description: formData.description,
        amenities: formData.amenities,
        country: formData.country,
        regionSlug: slugify(formData.region),
        citySlug: slugify(formData.city),
        postcode: formData.postcode,
        address: [formData.address, formData.address_line2].filter(Boolean).join('\n'),
        lat: formData.lat,
        lng: formData.lng,
        priceLabel: formData.price_range,
        priceFrom: formData.price_from ? (parseFloat(formData.price_from) || null) : null,
        priceCurrency: formData.price_currency || null,
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
        showcaseEnabled: formData.showcase_enabled ?? false,
        showcaseCategory: formData.showcase_category || 'venue',
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
        // Venue spaces, strip File objects, keep structured data
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
        roomsImages: roomsUpload.items || [],
        // Dining
        diningStyle: formData.dining_style || '',
        diningChefName: formData.dining_chef_name || '',
        diningInHouse: formData.dining_in_house ?? false,
        diningExternal: formData.dining_external ?? false,
        diningMenuStyles: formData.dining_menu_styles || [],
        diningDietary: formData.dining_dietary || [],
        diningDrinks: formData.dining_drinks || [],
        diningDescription: formData.dining_description || '',
        diningMenuImages: diningUpload.items || [],
        // Contact profile (strip the non-serialisable File object; persist the uploaded URL)
        contactProfile: formData.contact_profile
          ? { ...formData.contact_profile, photo_file: undefined, photo_url: contactPhotoUrl }
          : {},
        weddingsHosted: formData.weddings_hosted ? parseInt(formData.weddings_hosted, 10) || formData.weddings_hosted : null,
        memberSince:    formData.member_since    || null,
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
        managedAccountId: formData.managed_account_id || null,
        tier: 'standard',
        // Full rich media_items array (File objects stripped), stored as JSONB.
        // Also consumed by sync-media-ai-index edge function after save.
        mediaItems: cleanMediaItems,
        // Editorial Content Layer (Phase 3)
        heroSummary: formData.hero_summary || null,
        sectionIntros: formData.section_intros || {},
        editorialApproved: formData.editorial_approved ?? false,
        editorialFactChecked: formData.editorial_fact_checked ?? false,
        editorialLastReviewedAt: formData.editorial_last_reviewed_at || null,
        editorialLastReviewedBy: formData.editorial_last_reviewed_by || null,
        refreshNotes: formData.refresh_notes || null,
      };

      // Calculate content quality score for editorial layer (Phase 3)
      const contentQualityScore = calculateContentQualityScore(
        formData.section_intros,
        formData.editorial_fact_checked,
        formData.editorial_approved
      );
      listingPayload.contentQualityScore = contentQualityScore;

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
      console.log('Save complete, returning savedId:', savedId);
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
    uploadProgress,
    error,
    hasChanges,
    setError,
  };
};
