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

// ── Per-call timeout guard ────────────────────────────────────────────────────
// supabase-js can wedge indefinitely on the navigator-lock path (auth refresh
// lock held by a crashed/orphaned tab). When that happens REST calls never
// resolve or reject — they just hang. That defeats savePostSafe's retry
// because there is no thrown error to catch. Wrap every await in savePost
// with a hard per-step ceiling so a hang becomes a catchable error.
const SUPABASE_STEP_TIMEOUT_MS = 8000;
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`supabase-timeout:${label} after ${ms}ms (likely navigator-lock stall — reload tab)`));
    }, ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

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
  author:              'author_data',        // alias, editor stores it as `author`
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
  // Editorial workflow (added 20260404)
  workflowStatus:      'workflow_status',
  statusChangedAt:     'status_changed_at',
  reviewedBy:          'reviewed_by',
  // Feature flags (added 20260404)
  isFeatured:          'is_featured',
  featuredUntil:       'featured_until',
  homepageFeature:     'homepage_feature',
  categoryFeature:     'category_feature',
  // editorsChoice already mapped above → 'editors_choice'
  // AI Writer fields (added 20260404)
  aiTopic:             'ai_topic',
  aiTone:              'ai_tone',
  aiWordCount:         'ai_word_count',
  aiOutline:           'ai_outline',
  aiGenerated:         'ai_generated',
  aiLastGeneratedAt:   'ai_last_generated_at',
  aiMetadata:          'ai_metadata',
  // Multi-category (added 20260405)
  secondaryCategories:     'secondary_categories',
  // Editorial Intelligence score (added 20260405)
  contentScore:            'content_score',
  contentScoreGrade:       'content_score_grade',
  contentScoreBreakdown:   'content_score_breakdown',
  contentScoreUpdatedAt:   'content_score_updated_at',
};

// Keys NOT written to magazine_posts (stored elsewhere or derived)
// `galleryImages` lives inside ai_metadata.galleryImages, not as a top-level
// column — see mapPostToDb/mapPostFromDb below.
const POST_EXCLUDED_KEYS = new Set(['content', '_lastEdited', 'date', 'category',
  'coverImageFocal', 'relatedPosts', 'heroTextAlign', 'galleryImages']);

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
  // Piggyback galleryImages onto ai_metadata jsonb so the slider persists without
  // a schema migration. When the caller explicitly sets formData.galleryImages we
  // merge it into whatever ai_metadata we were already about to write, preserving
  // other keys (aiOutline etc). An empty array is still written so the user can
  // clear a gallery.
  if (Array.isArray(formData.galleryImages)) {
    const base = (row.ai_metadata && typeof row.ai_metadata === 'object') ? row.ai_metadata : {};
    row.ai_metadata = { ...base, galleryImages: formData.galleryImages };
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
  // Lift ai_metadata.galleryImages → formData.galleryImages so the editor's
  // slider can read it directly without knowing about the piggyback.
  if (c.aiMetadata && typeof c.aiMetadata === 'object' && Array.isArray(c.aiMetadata.galleryImages)) {
    c.galleryImages = c.aiMetadata.galleryImages;
  } else {
    c.galleryImages = [];
  }
  return c;
}

// ── Slug collision resolution ──────────────────────────────────────────────────
/**
 * Ensure the slug is unique in magazine_posts.
 * If a collision exists for a DIFFERENT id, append -2, -3, etc.
 * Returns { slug, changed }, callers should surface a warning if changed=true.
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
    if (!post) return { data: null, error: null }; // not in DB yet, caller uses static fallback

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
  // Per-step timing. When a save hangs past the editor's 20s ceiling, the
  // console shows exactly which Supabase round-trip was slow (slug lookup,
  // slug resolve, upsert, blocks read, blocks delete, blocks insert). Cheap
  // — one label per step, 0 cost on happy path.
  const t0 = performance.now();
  const mark = (label) => console.log(`[magazineService.savePost] ${label} +${Math.round(performance.now() - t0)}ms`);
  try {
    // Detect whether the incoming ID is a real DB UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let isDbId = formData.id && UUID_RE.test(formData.id);

    // For non-UUID IDs (seed/static articles): check if a DB record already exists
    // with this slug — if so, update it instead of inserting a duplicate each session
    let existingDbId = null;
    if (!isDbId && formData.slug) {
      mark('slug-lookup start');
      const { data: existing } = await withTimeout(
        supabase.from('magazine_posts').select('id').eq('slug', formData.slug).maybeSingle(),
        SUPABASE_STEP_TIMEOUT_MS,
        'slug-lookup',
      );
      mark('slug-lookup end');
      if (existing?.id) { existingDbId = existing.id; isDbId = true; }
    }
    const effectiveId = isDbId ? (existingDbId || formData.id) : null;

    // 1. Resolve slug collisions
    mark('resolveSlug start');
    const { slug: resolvedSlug, changed: slugChanged } = await resolveSlug(
      formData.slug || slugify(formData.title || 'untitled'),
      effectiveId
    );
    mark('resolveSlug end');

    // 2. Build DB row
    const row = mapPostToDb({ ...formData, slug: resolvedSlug });
    row.updated_at = new Date().toISOString();
    // id is never sent in the SET clause — Postgres generates it on INSERT,
    // and UPDATE uses .eq('id', effectiveId) not an explicit id field.
    delete row.id;

    // 3. Upsert post
    let savedPost;
    if (isDbId) {
      // Update existing (real UUID or found-by-slug)
      mark('update start');
      const { data, error } = await withTimeout(
        supabase.from('magazine_posts').update(row).eq('id', effectiveId).select().single(),
        SUPABASE_STEP_TIMEOUT_MS,
        'update',
      );
      mark('update end');
      if (error) throw error;
      savedPost = data;
    } else {
      // Insert new
      mark('insert start');
      const { data, error } = await withTimeout(
        supabase.from('magazine_posts').insert([row]).select().single(),
        SUPABASE_STEP_TIMEOUT_MS,
        'insert',
      );
      mark('insert end');
      if (error) throw error;
      savedPost = data;
    }

    // 4. Replace blocks — atomic two-phase: backup existing, delete, insert new with restore on failure
    mark('blocks-read start');
    const { data: existingBlocks } = await withTimeout(
      supabase.from('magazine_blocks').select('*').eq('post_id', savedPost.id).order('block_order', { ascending: true }),
      SUPABASE_STEP_TIMEOUT_MS,
      'blocks-read',
    );
    mark('blocks-read end');

    mark('blocks-delete start');
    const { error: deleteErr } = await withTimeout(
      supabase.from('magazine_blocks').delete().eq('post_id', savedPost.id),
      SUPABASE_STEP_TIMEOUT_MS,
      'blocks-delete',
    );
    mark('blocks-delete end');
    if (deleteErr && formData.content && formData.content.length > 0) {
      // Can't proceed with block replacement if delete failed
      throw deleteErr;
    }

    let blocksPersisted = false;
    const content = formData.content || [];
    if (content.length > 0) {
      const blockRows = content.map((block, i) => {
        const { type, ...blockContent } = block;
        return {
          post_id:       savedPost.id,
          block_type:    type,
          block_order:   i * 10,
          block_content: blockContent,
        };
      });
      mark('blocks-insert start');
      const { error: blocksErr } = await withTimeout(
        supabase.from('magazine_blocks').insert(blockRows),
        SUPABASE_STEP_TIMEOUT_MS,
        'blocks-insert',
      );
      mark('blocks-insert end');
      if (blocksErr) {
        console.error('[magazineService] Block insert failed, attempting restore:', blocksErr);
        // Restore backup to prevent data loss
        if (existingBlocks && existingBlocks.length > 0) {
          const restoreRows = existingBlocks.map(({ id: _id, created_at: _ca, updated_at: _ua, ...rest }) => rest);
          const { error: restoreErr } = await supabase.from('magazine_blocks').insert(restoreRows);
          if (restoreErr) {
            console.error('[magazineService] Block restore failed — blocks lost!', restoreErr);
            return {
              data: null,
              error: new Error(`Post saved but blocks failed to restore. Post ID: ${savedPost.id}. Manual recovery needed.`),
              slugChanged,
              resolvedSlug,
              blockRestoreFailed: true
            };
          }
          if (import.meta.env.VITE_DEBUG_MAGAZINE) console.log('[magazineService] Blocks restored from backup');
        } else {
          return {
            data: null,
            error: new Error(`Post saved but no blocks could be inserted. Post ID: ${savedPost.id}. Content lost.`),
            slugChanged,
            resolvedSlug,
            blockInsertFailed: true
          };
        }
      } else {
        blocksPersisted = true;
      }
    } else {
      blocksPersisted = true; // Empty content is valid
    }

    mark('done');
    const result = mapPostFromDb(savedPost);
    result.content = formData.content || [];
    return {
      data: result,
      error: null,
      slugChanged,
      resolvedSlug,
      isNewRecord: !isDbId && !existingDbId,
      blocksPersisted // Client can verify blocks were saved successfully
    };
  } catch (err) {
    mark(`threw: ${err?.message || err}`);
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

/**
 * Extract mentions of venues and planners from article content.
 * Used for auto-linking phase (Phase 3: Internal Linking Engine).
 *
 * @param {Object} post - article object with title, excerpt, standfirst, content[]
 * @returns {Array} array of { name, type, entityId, confidence, context }
 */
export async function extractMentionsFromPost(post) {
  if (!post) return [];

  try {
    const { findMentionsInArticle } = await import('./entityMatchingService.js');
    return findMentionsInArticle(post);
  } catch (err) {
    console.error('[magazineService] extractMentionsFromPost failed:', err);
    return [];
  }
}

/**
 * Fetch published articles with optional filtering.
 * Used by article search and recommendation engine.
 *
 * @param {Object} filters
 *   - category_slug?: string — filter by category
 *   - featured?: boolean — only featured articles
 *   - trending?: boolean — only trending articles
 *   - tags?: string[] — articles matching ANY tag
 *   - limit?: number — max results (default 100)
 *   - offset?: number — pagination offset (default 0)
 *
 * Returns: { data: [], error }
 */
export async function fetchPublishedArticles(filters = {}) {
  if (!isSupabaseAvailable()) return { data: [], error: null };
  try {
    const {
      category_slug,
      featured,
      trending,
      tags,
      limit = 100,
      offset = 0,
    } = filters;

    let q = supabase
      .from('magazine_posts')
      .select('*')
      .eq('published', true);

    if (category_slug) q = q.eq('category_slug', category_slug);
    if (featured) q = q.eq('featured', true);
    if (trending) q = q.eq('trending', true);

    // Tag filtering: articles with tags array containing ANY of the provided tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Use overlaps operator if available, otherwise fetch all and filter client-side
      q = q.overlaps('tags', tags);
    }

    q = q.order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw error;
    return { data: (data || []).map(mapPostFromDb), error: null };
  } catch (err) {
    console.error('[magazineService] fetchPublishedArticles:', err);
    return { data: [], error: err };
  }
}

/**
 * Full-text search over published articles.
 * Searches title, excerpt, tags, and category by substring matching.
 *
 * @param {string} query — search terms
 * @param {Object} options
 *   - limit?: number — max results (default 20)
 *   - category_slug?: string — scope to category
 *
 * Returns: { data: [], error }
 */
export async function searchArticlesFullText(query = '', options = {}) {
  if (!isSupabaseAvailable()) return { data: [], error: null };
  if (!query.trim()) return { data: [], error: null };

  try {
    const { limit = 20, category_slug } = options;
    const normalizedQuery = query.toLowerCase();

    // Fetch all published articles (or scoped to category)
    // In production, consider adding a full-text search column in Postgres
    let filters = { limit: 1000 }; // Fetch a large batch for client-side filtering
    if (category_slug) {
      filters.category_slug = category_slug;
    }

    const { data: articles, error } = await fetchPublishedArticles(filters);
    if (error) throw error;

    // Client-side filtering (title, excerpt, tags, category)
    const filtered = (articles || []).filter(article => {
      // Title match (highest priority)
      if (article.title?.toLowerCase().includes(normalizedQuery)) return true;

      // Excerpt match
      if (article.excerpt?.toLowerCase().includes(normalizedQuery)) return true;

      // Tag match
      if (Array.isArray(article.tags)) {
        if (article.tags.some(t => t.toLowerCase().includes(normalizedQuery))) {
          return true;
        }
      }

      // Category label match
      if (article.categoryLabel?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      return false;
    });

    return { data: filtered.slice(0, limit), error: null };
  } catch (err) {
    console.error('[magazineService] searchArticlesFullText:', err);
    return { data: [], error: err };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL ARTICLE LINK SUGGESTIONS
// Finds published articles related to the current article's content/keywords.
// Used by the SEO panel to suggest internal links proactively.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * suggestArticleLinks({ title, content, tags, categorySlug, currentPostId, focusKeyword })
 * Returns: Array of { id, slug, title, categoryLabel, score, matchedTerms }
 * Sorted by relevance score descending. Max 5 results.
 */
export async function suggestArticleLinks({ title, content, tags, categorySlug, currentPostId, focusKeyword }) {
  if (!isSupabaseAvailable()) return [];

  // Build a bag of terms from the current article
  const terms = new Set();
  if (focusKeyword) focusKeyword.toLowerCase().split(/\s+/).forEach(w => w.length > 3 && terms.add(w));
  if (title) title.toLowerCase().split(/\s+/).forEach(w => w.length > 3 && terms.add(w));
  if (Array.isArray(tags)) tags.forEach(t => terms.add(t.toLowerCase()));

  // Extract key nouns from content blocks (first 8 headings + intro)
  if (Array.isArray(content)) {
    content
      .filter(b => b.type === 'heading' || b.type === 'intro')
      .slice(0, 8)
      .forEach(b => {
        const txt = (b.text || '').replace(/<[^>]*>/g, '').toLowerCase();
        txt.split(/\s+/).forEach(w => w.length > 4 && terms.add(w));
      });
  }

  if (terms.size === 0) return [];

  // Fetch published articles (exclude current)
  const { data: articles } = await fetchPublishedArticles({ limit: 200 });
  if (!articles || articles.length === 0) return [];

  const stopWords = new Set(['about','their','there','these','those','which','would','could','should','being','after','before','between','through','during','without','within']);

  const scored = articles
    .filter(a => a.id !== currentPostId)
    .map(article => {
      const haystack = [
        article.title,
        article.excerpt,
        ...(Array.isArray(article.tags) ? article.tags : []),
        article.categoryLabel,
      ].filter(Boolean).join(' ').toLowerCase();

      let score = 0;
      const matchedTerms = [];

      for (const term of terms) {
        if (stopWords.has(term)) continue;
        if (haystack.includes(term)) {
          score += term.length > 6 ? 3 : 1; // longer terms = stronger signal
          matchedTerms.push(term);
        }
      }

      // Boost same category
      if (categorySlug && article.categorySlug === categorySlug) score += 2;

      return { id: article.id, slug: article.slug, title: article.title, categoryLabel: article.categoryLabel, score, matchedTerms };
    })
    .filter(a => a.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}


// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const CAT_FIELD_MAP = {
  id:                    'id',
  slug:                  'slug',
  name:                  'name',
  label:                 'name',           // Alias: form may use 'label'
  description:           'description',
  heroImage:             'hero_image',
  accentColor:           'accent_color',
  heroTitle:             'hero_title',
  cardStyle:             'card_style',
  defaultCardStyle:      'card_style',     // Alias: form may use this
  sortOrder:             'sort_order',
  parentSlug:            'parent_category_slug',  // Subcategories support
  seoTitle:              'seo_title',
  seoDescription:        'seo_description',
  metaDescription:       'seo_description', // Alias
  seoKeywords:           'seo_keywords',
  // Tier 1: Core AI & Aura Integration (added 20260407)
  aiDiscoveryEnabled:    'ai_discovery_enabled',
  aiCuratorPrompt:       'ai_curator_prompt',
  editorialVoice:        'editorial_voice',
  discoveryKeywords:     'discovery_keywords',
  targetAudience:        'target_audience',
  auraPriority:          'aura_priority',
  // Tier 1: Homepage & Editorial Promotion (added 20260407)
  featuredOnHomepage:    'featured_on_homepage',
  homepageSortOrder:     'homepage_sort_order',
  isActive:              'is_active',
  icon:                  'icon',
  // Tier 2: Content Strategy (added 20260407)
  contentGuidelines:     'content_guidelines',
  featuredUntil:         'featured_until',
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

  // Log payload for debugging FK constraint issues (use DEBUG_MAGAZINE env var to enable)
  if (import.meta.env.VITE_DEBUG_MAGAZINE && (data.label || data.slug)) {
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
 * Fire-and-forget, errors are logged but not thrown.
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
