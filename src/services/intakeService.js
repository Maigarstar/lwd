// ─────────────────────────────────────────────────────────────────────────────
// Listing Intake Studio — Service Layer
// Handles: intake_jobs CRUD, Supabase Storage uploads,
//          ai-extract-listing edge function, push-to-listing mapping
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabaseClient';

const BUCKET = 'listing-media';

// ── Utility ──────────────────────────────────────────────────────────────────

export function getDocumentType(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.pdf'))  return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt'))  return 'txt';
  return 'text';
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferVideoType(url) {
  if (!url) return 'internal';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'internal';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── intake_jobs CRUD ──────────────────────────────────────────────────────────

export async function fetchIntakeJobs() {
  const { data, error } = await supabase
    .from('intake_jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchIntakeJob(id) {
  const { data, error } = await supabase
    .from('intake_jobs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createIntakeJob(fields) {
  const { data, error } = await supabase
    .from('intake_jobs')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIntakeJob(id, fields) {
  const { error } = await supabase
    .from('intake_jobs')
    .update(fields)
    .eq('id', id);
  if (error) throw error;
}

// ── Storage uploads ───────────────────────────────────────────────────────────

export async function uploadIntakeDocument(file, jobId) {
  const ext = file.name.split('.').pop();
  const path = `intake/docs/${jobId}/document.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '86400' });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: publicUrl };
}

export async function uploadIntakeImages(files, jobId) {
  const urls = [];
  for (const file of files) {
    const ext = file.name.split('.').pop();
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `intake/images/${jobId}/${uid}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, cacheControl: '31536000' });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(publicUrl);
    }
  }
  return urls;
}

// ── AI extraction ─────────────────────────────────────────────────────────────

export async function runExtraction({
  jobId,
  listingId,      // pass this on re-runs so AI loads existing listing data (enhance mode)
  document,
  documentType,
  videoUrls = [],
  websiteUrl = '',
  pastedText = '',
  venueName = '',
  listingType = 'venue',
}) {
  const files = [];

  if (document) {
    const base64 = await fileToBase64(document);
    files.push({
      name:      document.name,
      type:      documentType,
      mediaType: document.type || (documentType === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
      data:      base64,
    });
  }

  const body = {
    venueName,
    listingType,
    pastedText:  pastedText  || '',
    websiteUrl:  websiteUrl  || '',
    videoLinks:  videoUrls.filter(v => v.trim()),
    files,
    venue_id:   jobId,
    // listing_id enables enhance/learning mode — AI loads existing listing as prior context
    ...(listingId ? { listing_id: listingId } : {}),
  };

  const { data, error } = await supabase.functions.invoke('ai-extract-listing', { body });

  // supabase.functions.invoke swallows the real error body on non-2xx.
  // Extract the actual message from the edge function response.
  if (error) {
    let realMessage = error.message || 'Extraction failed';
    try {
      // FunctionsHttpError exposes the raw response via error.context
      if (error.context) {
        const body = await error.context.json().catch(() => null);
        if (body?.error) realMessage = body.error;
      }
    } catch { /* ignore parse errors */ }
    throw new Error(realMessage);
  }
  if (data?.error) throw new Error(data.error);

  const extracted = data?.result || {};
  const meta      = extracted._meta || {};

  // Keep raw text for audit trail
  const rawText = [
    pastedText ? `PASTED TEXT:\n${pastedText}` : null,
    `EXTRACTED JSON:\n${JSON.stringify(extracted, null, 2).slice(0, 4000)}`,
  ].filter(Boolean).join('\n\n---\n\n');

  return { extracted, meta, rawText };
}

// ── Push to listing ───────────────────────────────────────────────────────────

export async function pushToListing({ job, extractedData, copyMode, imageUrls, videoUrls }) {
  const d    = extractedData || {};
  const name = d.venue_name || 'Untitled Venue';

  // Unique slug: name + short timestamp
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  // ── Map extracted JSON → listings table columns ──────────────────────────
  const listing = {
    name,
    slug,
    listing_type: job.listing_type || 'venue',
    status:       'draft',
    visibility:   'private',

    // Location
    address:      d.address      || null,
    address_line2: d.address_line2 || null,
    postcode:     d.postcode     || null,
    city:         d.city         || null,
    region:       d.region       || null,
    country:      d.country      || null,

    // Core content
    summary:      d.summary      || null,
    description:  d.description  || null,
    amenities:    d.amenities    || null,
    capacity:     d.capacity     || null,
    price_range:  d.price_range  || null,

    // Accommodation
    rooms_total:              d.rooms_total       ? (parseInt(d.rooms_total)       || null) : null,
    rooms_suites:             d.rooms_suites      ? (parseInt(d.rooms_suites)      || null) : null,
    rooms_max_guests:         d.rooms_max_guests  ? (parseInt(d.rooms_max_guests)  || null) : null,
    rooms_accommodation_type: d.rooms_accommodation_type || null,
    rooms_min_stay:           d.rooms_min_stay    || null,
    rooms_exclusive_use:      d.rooms_exclusive_use || false,
    rooms_description:        d.rooms_description || null,

    // Dining
    dining_style:        d.dining_style        || null,
    dining_chef_name:    d.dining_chef_name    || null,
    dining_in_house:     d.dining_in_house     || false,
    dining_external:     d.dining_external     || false,
    dining_menu_styles:  Array.isArray(d.dining_menu_styles)  ? d.dining_menu_styles  : [],
    dining_dietary:      Array.isArray(d.dining_dietary)      ? d.dining_dietary      : [],
    dining_drinks:       Array.isArray(d.dining_drinks)       ? d.dining_drinks       : [],
    dining_description:  d.dining_description  || null,

    // Spaces (JSONB, max 5)
    spaces: d.spaces?.length > 0 ? d.spaces.slice(0, 5) : null,

    // Exclusive use
    exclusive_use_enabled:     d.exclusive_use_enabled     || false,
    exclusive_use_title:       d.exclusive_use_title       || null,
    exclusive_use_price:       d.exclusive_use_price       || null,
    exclusive_use_subline:     d.exclusive_use_subline     || null,
    exclusive_use_description: d.exclusive_use_description || null,
    exclusive_use_includes:    d.exclusive_use_includes?.length > 0 ? d.exclusive_use_includes : null,

    // FAQs
    faq_enabled:    d.faq_enabled    || false,
    faq_categories: d.faq_categories?.length > 0 ? d.faq_categories : null,

    // Nearby experiences
    nearby_enabled: d.nearby_enabled || false,
    nearby_items:   d.nearby_items?.length > 0 ? d.nearby_items : null,

    // Contact — save if any useful contact field was extracted
    contact_profile: (d.contact_profile?.name || d.contact_profile?.email || d.contact_profile?.phone || d.contact_profile?.website)
      ? d.contact_profile
      : null,

    // SEO
    seo_title:       d.seo_title       || null,
    seo_description: d.seo_description || null,
    seo_keywords:    d.seo_keywords?.length > 0 ? d.seo_keywords : null,

    // Videos — stored as JSONB array
    videos: videoUrls.filter(u => u.trim()).length > 0
      ? videoUrls.filter(u => u.trim()).map(url => ({ url, type: inferVideoType(url) }))
      : null,

    // Hero image (first uploaded image)
    hero_images: imageUrls.length > 0
      ? [{ url: imageUrls[0], featured: true }]
      : null,

    // media_items JSONB — populated from uploaded images so that
    // gallery fallbacks in Spaces / Rooms / Dining work immediately,
    // without needing a separate Listing Studio pass.
    // Format mirrors the shape expected by buildCardImgs / mapMediaItemToCardImg.
    media_items: imageUrls.length > 0
      ? imageUrls.map((url, i) => ({
          id:          `intake-${i}`,
          type:        'image',
          url,
          alt_text:    '',
          visibility:  'public',
          is_featured: i === 0,
          sort_order:  i,
        }))
      : null,
  };

  const { data: created, error: listingError } = await supabase
    .from('listings')
    .insert(listing)
    .select('id')
    .single();

  if (listingError) throw listingError;
  const listingId = created.id;

  // ── Write listing_id back to intake_job so re-runs can find it ───────────
  if (job?.id) {
    await supabase
      .from('intake_jobs')
      .update({ listing_id: listingId, status: 'pushed', pushed_at: new Date().toISOString() })
      .eq('id', job.id);
  }

  // ── Attach images to listing_media ───────────────────────────────────────
  if (imageUrls.length > 0) {
    const mediaItems = imageUrls.map((url, i) => ({
      listing_id:    listingId,
      type:          'image',
      url,
      role:          i === 0 ? 'hero' : 'gallery',
      featured:      i === 0,
      display_order: i,
    }));
    await supabase.from('listing_media').insert(mediaItems);
  }

  return listingId;
}
