/**
 * magazineService.js
 *
 * Full CRUD service layer for Magazine Studio.
 * Follows the same pattern as listings.ts:
 *   - isSupabaseAvailable() guard on every function
 *   - try/catch with { data, error } returns
 *   - snake_case DB ↔ camelCase frontend conversion
 *
 * AI-ready: insertBlock() allows the AI engine to programmatically
 * insert blocks into any article without a full savePost() round-trip.
 */

import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

// ── Case helpers ───────────────────────────────────────────────────────────────
function snakeToCamel(key) {
  return key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}
function camelToSnake(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}
function rowToCamel(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const k in row) out[snakeToCamel(k)] = row[k];
  return out;
}

// ── DB field map: camelCase formData → snake_case DB columns ──────────────────
const POST_FIELD_MAP = {
  id:                  'id',
  slug:                'slug',
  title:               'title',
  excerpt:             'excerpt',
  standfirst:          'standfirst',
  categorySlug:        'category_slug',
  categoryLabel:       'category_label',
  authorData:          'author_data',        // { id, name, role, bio, avatar }
  author:              'author_data',        // alias — editor stores it as `author`
  tags:                'tags',
  readingTime:         'reading_time',
  published:           'published',
  publishedAt:         'published_at',
  featured:            'featured',
  trending:            'trending',
  editorsChoice:       'editors_choice',
  scheduledDate:       'scheduled_date',
  layout:              'layout',
  heroStyle:           'hero_style',
  heroHeight:          'hero_height',
  coverImage:          'cover_image',
  coverImageAlt:       'cover_image_alt',
  coverImageCredit:    'cover_image_credit',
  heroVideoUrl:        'hero_video_url',
  heroOverlayOpacity:  'hero_overlay_opacity',
  heroFocalPoint:      'hero_focal_point',
  heroTitlePosition:   'hero_title_position',
  tone:                'tone',
  seoTitle:            'seo_title',
  metaDescription:     'meta_description',
  ogTitle:             'og_title',
  ogDescription:       'og_description',
  ogImage:             'og_image',
};

// Keys NOT written to magazine_posts (stored elsewhere or derived)
const POST_EXCLUDED_KEYS = new Set(['content', '_lastEdited', 'date', 'category',
  'coverImageFocal', 'relatedPosts', 'heroTextAlign']);

function mapPostToDb(formData) {
  const row = {};
  for (const [camel, snake] of Object.entries(POST_FIELD_MAP)) {
    if (POST_EXCLUDED_KEYS.has(camel)) continue;
    const val = formData[camel];
    if (val === undefined) continue;
    row[snake] = val;
  }
  // Normalise author: editor stores it as `author` (object), DB wants author_data
  if (formData.author && !row.author_data) {
    row.author_data = formData.author;
  }
  // Ensure published_at is set when publishing
  if (row.published && !row.published_at) {
    row.published_at = new Date().toISOString();
  }
  return row;
}

function mapPostFromDb(row) {
  const c = rowToCamel(row);
  // Remap snake remnants the generic converter misses
  c.author      = c.authorData || null;
  c.content     = [];    // blocks fetched separately, merged by fetchPostBySlug
  c.readingTime = c.readingTime ?? 5;
  c.tags        = c.tags ?? [];
  return c;
}

// ── Slug collision resolution ──────────────────────────────────────────────────
/**
 * Ensure the slug is unique in magazine_posts.
 * If a collision exists for a DIFFERENT id, append -2, -3, etc.
 * Returns { slug, changed } — callers should surface a warning if changed=true.
 */
async function resolveSlug(slug, excludeId = null) {
  if (!isSupabaseAvailable()) return { slug, changed: false };
  let candidate = slug;
  let n = 2;
  while (true) {
    let q = supabase.from('magazine_posts').select('id').eq('slug', candidate);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return { slug: candidate, changed: candidate !== slug };
    candidate = `${slug}-${n++}`;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// POSTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch post summaries (no blocks).
 * filters: { published?: boolean, featured?: boolean, category_slug?: string }
 */
export async function fetchPosts(filters = {}) {
  if (!isSupabaseAvailable()) return { data: [], error: null };
  try {
    let q = supabase.from('magazine_posts').select('*');
    if (filters.published !== undefined) q = q.eq('published', filters.published);
    if (filters.featured  !== undefined) q = q.eq('featured',  filters.featured);
    if (filters.category_slug)           q = q.eq('category_slug', filters.category_slug);
    q = q.order('updated_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return { data: (data || []).map(mapPostFromDb), error: null };
  } catch (err) {
    console.error('[magazineService] fetchPosts:', err);
    return { data: [], error: err };
  }
}

/**
 * Fetch a single post by slug, including its blocks reconstructed as content[].
 */
export async function fetchPostBySlug(slug) {
  if (!isSupabaseAvailable()) return { data: null, error: null };
  try {
    const { data: post, error: postErr } = await supabase
      .from('magazine_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (postErr) throw postErr;
    if (!post) return { data: null, error: null }; // not in DB yet — caller uses static fallback

    const { data: blocks, error: blocksErr } = await supabase
      .from('magazine_blocks')
      .select('*')
      .eq('post_id', post.id)
      .order('block_order', { ascending: true });
    if (blocksErr) throw blocksErr;

    const mapped = mapPostFromDb(post);
    mapped.content = (blocks || []).map(b => ({ type: b.block_type, ...b.block_content }));
    return { data: mapped, error: null };
  } catch (err) {
    console.error('[magazineService] fetchPostBySlug:', err);
    return { data: null, error: err };
  }
}

/**
 * Save (upsert) a post and replace its blocks atomically.
 * Returns { data: savedPost, error, slugChanged, resolvedSlug }
 */
export async function savePost(formData) {
  if (!isSupabaseAvailable()) return { data: null, error: new Error('Supabase not configured') };
  try {
    // Detect whether the incoming ID is a real DB UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isDbId = formData.id && UUID_RE.test(formData.id);

    // 1. Resolve slug collisions
    const { slug: resolvedSlug, changed: slugChanged } = await resolveSlug(
      formData.slug || slugify(formData.title || 'untitled'),
      isDbId ? formData.id : null
    );

    // 2. Build DB row
    const row = mapPostToDb({ ...formData, slug: resolvedSlug });
    row.updated_at = new Date().toISOString();
    if (!isDbId) delete row.id; // let Postgres generate a real UUID

    // 3. Upsert post (on conflict on slug, update)
    let savedPost;
    if (isDbId) {
      // Update existing
      const { data, error } = await supabase
        .from('magazine_posts')
        .update(row)
        .eq('id', formData.id)
        .select()
        .single();
      if (error) throw error;
      savedPost = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('magazine_posts')
        .insert([row])
        .select()
        .single();
      if (error) throw error;
      savedPost = data;
    }

    // 4. Replace blocks atomically
    await supabase.from('magazine_blocks').delete().eq('post_id', savedPost.id);

    const content = formData.content || [];
    if (content.length > 0) {
      const blockRows = content.map((block, i) => {
        const { type, ...blockContent } = block;
        return {
          post_id:       savedPost.id,
          block_type:    type,
          block_order:   i * 10,   // multiples of 10 for easy AI insertion
          block_content: blockContent,
        };
      });
      const { error: blocksErr } = await supabase.from('magazine_blocks').insert(blockRows);
      if (blocksErr) throw blocksErr;
    }

    const result = mapPostFromDb(savedPost);
    result.content = formData.content || [];
    return { data: result, error: null, slugChanged, resolvedSlug };
  } catch (err) {
    console.error('[magazineService] savePost:', err);
    return { data: null, error: err, slugChanged: false, resolvedSlug: formData.slug };
  }
}

/**
 * Publish a post: set published=true, published_at=now()
 */
export async function publishPost(id) {
  if (!isSupabaseAvailable()) return { error: new Error('Supabase not configured') };
  try {
    const { error } = await supabase
      .from('magazine_posts')
      .update({ published: true, published_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[magazineService] publishPost:', err);
    return { error: err };
  }
}

/**
 * Unpublish a post: set published=false
 */
export async function unpublishPost(id) {
  if (!isSupabaseAvailable()) return { error: new Error('Supabase not configured') };
  try {
    const { error } = await supabase
      .from('magazine_posts')
      .update({ published: false })
      .eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[magazineService] unpublishPost:', err);
    return { error: err };
  }
}

/**
 * Delete a post (blocks cascade via FK).
 */
export async function deletePost(id) {
  if (!isSupabaseAvailable()) return { error: new Error('Supabase not configured') };
  try {
    const { error } = await supabase.from('magazine_posts').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[magazineService] deletePost:', err);
    return { error: err };
  }
}

/**
 * AI-READY: Insert a single block at a specific order position.
 * The AI engine calls this directly to inject generated content
 * without a full savePost() round-trip.
 *
 * @param {string} postId
 * @param {string} blockType  e.g. 'paragraph', 'heading', 'image'
 * @param {number} blockOrder  e.g. 25 (between order 20 and 30)
 * @param {object} blockContent  The block payload (without `type`)
 */
export async function insertBlock(postId, blockType, blockOrder, blockContent) {
  if (!isSupabaseAvailable()) return { data: null, error: new Error('Supabase not configured') };
  try {
    const { data, error } = await supabase
      .from('magazine_blocks')
      .insert([{ post_id: postId, block_type: blockType, block_order: blockOrder, block_content: blockContent }])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[magazineService] insertBlock:', err);
    return { data: null, error: err };
  }
}

/**
 * AI-READY: Replace all blocks for a post with a new content array.
 * Used when AI generates a full article structure.
 *
 * @param {string} postId
 * @param {Array}  contentArray  Array of { type, ...blockContent }
 */
export async function replaceBlocks(postId, contentArray) {
  if (!isSupabaseAvailable()) return { error: new Error('Supabase not configured') };
  try {
    await supabase.from('magazine_blocks').delete().eq('post_id', postId);
    if (contentArray.length > 0) {
      const rows = contentArray.map((block, i) => {
        const { type, ...blockContent } = block;
        return { post_id: postId, block_type: type, block_order: i * 10, block_content: blockContent };
      });
      const { error } = await supabase.from('magazine_blocks').insert(rows);
      if (error) throw error;
    }
    return { error: null };
  } catch (err) {
    console.error('[magazineService] replaceBlocks:', err);
    return { error: err };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const CAT_FIELD_MAP = {
  id:               'id',
  slug:             'slug',
  name:             'name',
  label:            'name',           // Alias: form may use 'label'
  description:      'description',
  heroImage:        'hero_image',
  accentColor:      'accent_color',
  heroTitle:        'hero_title',
  cardStyle:        'card_style',
  defaultCardStyle: 'card_style',     // Alias: form may use this
  sortOrder:        'sort_order',
  parentSlug:       'parent_category_slug',  // Subcategories support
  seoTitle:         'seo_title',
  seoDescription:   'seo_description',
  metaDescription:  'seo_description', // Alias
  ogImage:          'og_image',        // OG image for social
  seoKeywords:      'seo_keywords',
};

function mapCatToDb(data) {
  const row = {};
  for (const [camel, snake] of Object.entries(CAT_FIELD_MAP)) {
    if (data[camel] !== undefined) {
      let value = data[camel];

      // Normalize empty parentSlug to null (for top-level categories)
      // FK constraint on parent_category_slug requires null, not empty string
      if (camel === 'parentSlug' && (!value || value.trim() === '')) {
        value = null;
      }

      row[snake] = value;
    }
  }

  // Log payload for debugging FK constraint issues
  if (data.label || data.slug) {
    console.log('[mapCatToDb] Saving category:', {
      slug: row.slug,
      name: row.name,
      parent_category_slug: row.parent_category_slug
    });
  }

  return row;
}

/**
 * Fetch all categories.
 */
export async function fetchCategories() {
  if (!isSupabaseAvailable()) return { data: [], error: null };
  try {
    const { data, error } = await supabase
      .from('magazine_categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return { data: (data || []).map(rowToCamel), error: null };
  } catch (err) {
    console.error('[magazineService] fetchCategories:', err);
    return { data: [], error: err };
  }
}

/**
 * Upsert a category by slug.
 */
export async function saveCategory(catData) {
  if (!isSupabaseAvailable()) return { data: null, error: new Error('Supabase not configured') };
  try {
    const row = mapCatToDb(catData);
    row.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('magazine_categories')
      .upsert([row], { onConflict: 'slug' })
      .select()
      .single();
    if (error) throw error;
    return { data: rowToCamel(data), error: null };
  } catch (err) {
    console.error('[magazineService] saveCategory:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a category by slug.
 */
export async function deleteCategory(slug) {
  if (!isSupabaseAvailable()) return { error: new Error('Supabase not configured') };
  try {
    const { error } = await supabase.from('magazine_categories').delete().eq('slug', slug);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[magazineService] deleteCategory:', err);
    return { error: err };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// HOMEPAGE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch the homepage sections config.
 * Returns the sections array, or null if no row exists yet.
 */
export async function fetchHomepageConfig() {
  if (!isSupabaseAvailable()) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('magazine_homepage')
      .select('sections')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { data: data?.sections ?? null, error: null };
  } catch (err) {
    console.error('[magazineService] fetchHomepageConfig:', err);
    return { data: null, error: err };
  }
}

/**
 * Upsert the homepage sections config (single row pattern).
 */
export async function saveHomepageConfig(sections) {
  if (!isSupabaseAvailable()) return { error: new Error('Supabase not configured') };
  try {
    // Check for existing row
    const { data: existing } = await supabase
      .from('magazine_homepage')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from('magazine_homepage')
        .update({ sections, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('magazine_homepage')
        .insert([{ sections }]);
      if (error) throw error;
    }
    return { error: null };
  } catch (err) {
    console.error('[magazineService] saveHomepageConfig:', err);
    return { error: err };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Track an uploaded file in magazine_media.
 * Called by MagazineMediaUploader after a successful Supabase Storage upload.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function trackMediaUpload(fileUrl, meta = {}) {
  if (!isSupabaseAvailable()) return;
  try {
    await supabase.from('magazine_media').insert([{
      file_url:  fileUrl,
      title:     meta.title    || null,
      alt_text:  meta.alt      || null,
      caption:   meta.caption  || null,
      credit:    meta.credit   || null,
    }]);
  } catch (err) {
    console.warn('[magazineService] trackMediaUpload (non-fatal):', err);
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert a title to a URL-safe slug.
 * e.g. "The Art of the Amalfi Wedding" → "the-art-of-the-amalfi-wedding"
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
