// ═══════════════════════════════════════════════════════════════════════════
// referenceService.js — Reference System service layer
// Phase 4: Content → Commerce bridge
//
// Handles:
//   - Saving/loading structured references for articles
//   - Auto-suggesting references from article content
//   - Click tracking for references
//   - Bi-directional: "Featured in" for listings
//   - Commercial priority ranking
// ═══════════════════════════════════════════════════════════════════════════

// ── Tier weights for commercial priority ────────────────────────────────────
const TIER_WEIGHT = { showcase: 30, featured: 20, premium: 15, standard: 5, free: 0 };

// ── Save a reference for an article ─────────────────────────────────────────
export async function saveReference(ref) {
  const { supabase } = await import('../lib/supabaseClient');
  const { data, error } = await supabase
    .from('article_references')
    .upsert({
      post_id:         ref.postId,
      entity_type:     ref.entityType,
      entity_id:       ref.entityId || null,
      entity_slug:     ref.slug,
      entity_label:    ref.label,
      entity_url:      ref.url,
      block_id:        ref.blockId || null,
      anchor_text:     ref.anchorText || null,
      position:        ref.position || 0,
      reference_tier:  ref.referenceTier || 'linked',
      entity_image:    ref.image || null,
      entity_subtitle: ref.subtitle || null,
      entity_tier:     ref.tier || null,
    }, { onConflict: 'id' })
    .select()
    .single();

  return { data, error };
}

// ── Load all references for an article ──────────────────────────────────────
export async function loadReferences(postId) {
  if (!postId) return [];
  const { supabase } = await import('../lib/supabaseClient');
  const { data, error } = await supabase
    .from('article_references')
    .select('*')
    .eq('post_id', postId)
    .order('position', { ascending: true });

  if (error) { console.error('[referenceService] loadReferences:', error); return []; }
  return (data || []).map(r => ({
    id:            r.id,
    postId:        r.post_id,
    entityType:    r.entity_type,
    entityId:      r.entity_id,
    slug:          r.entity_slug,
    label:         r.entity_label,
    url:           r.entity_url,
    blockId:       r.block_id,
    anchorText:    r.anchor_text,
    position:      r.position,
    referenceTier: r.reference_tier,
    image:         r.entity_image,
    subtitle:      r.entity_subtitle,
    tier:          r.entity_tier,
    clickCount:    r.click_count,
    lastClicked:   r.last_clicked,
  }));
}

// ── Delete a reference ──────────────────────────────────────────────────────
export async function deleteReference(refId) {
  const { supabase } = await import('../lib/supabaseClient');
  return supabase.from('article_references').delete().eq('id', refId);
}

// ── Track a reference click (fire-and-forget) ──────────────────────────────
export async function trackReferenceClick({ referenceId, postId, entityType, entityId, entitySlug, sourceUrl, sessionId, position, viewport }) {
  try {
    const { supabase } = await import('../lib/supabaseClient');
    await supabase.from('reference_clicks').insert({
      reference_id:        referenceId || null,
      post_id:             postId || null,
      entity_type:         entityType,
      entity_id:           entityId || null,
      entity_slug:         entitySlug || null,
      source_url:          sourceUrl || window.location.pathname,
      session_id:          sessionId || null,
      position_in_article: position || null,
      viewport:            viewport || (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'),
    });
  } catch (_) {
    // Non-critical
  }
}

// ── Get "Featured in" articles for a listing/showcase ────────────────────────
export async function getFeaturedInArticles(entityId, entityType = 'listing') {
  if (!entityId) return [];
  const { supabase } = await import('../lib/supabaseClient');
  const { data, error } = await supabase
    .from('listing_editorial_features')
    .select('*')
    .eq('listing_id', entityId)
    .eq('entity_type', entityType)
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) { console.error('[referenceService] getFeaturedInArticles:', error); return []; }
  return data || [];
}

// ── Auto-suggest references from article content ────────────────────────────
// Scans article text for potential entity matches across all entity types.
// Returns scored suggestions with commercial priority boost.
export async function autoSuggestReferences({ title, content, tags, categorySlug, currentPostId, focusKeyword, existingRefs = [] }) {
  const { supabase } = await import('../lib/supabaseClient');

  // Build term bag from article content
  const terms = new Set();
  if (focusKeyword) focusKeyword.toLowerCase().split(/\s+/).forEach(w => w.length > 3 && terms.add(w));
  if (title) title.toLowerCase().split(/\s+/).forEach(w => w.length > 3 && terms.add(w));
  if (Array.isArray(tags)) tags.forEach(t => terms.add(t.toLowerCase()));

  // Extract from content blocks
  if (Array.isArray(content)) {
    content.forEach(b => {
      const txt = [b.text, b.caption, b.attribution, b.question, b.answer]
        .filter(Boolean).join(' ').replace(/<[^>]*>/g, '').toLowerCase();
      txt.split(/\s+/).forEach(w => w.length > 4 && terms.add(w));
    });
  }

  if (terms.size === 0) return [];

  const stopWords = new Set([
    'about','their','there','these','those','which','would','could','should',
    'being','after','before','between','through','during','without','within',
    'luxury','wedding','venue','venues','couples','perfect','beautiful',
    'stunning','elegant','romantic','celebration','experience',
  ]);

  // Existing ref entity IDs to exclude
  const existingIds = new Set(existingRefs.map(r => r.entityId).filter(Boolean));

  const suggestions = [];

  // ── Listings ──
  try {
    const { data: listings } = await supabase
      .from('listings')
      .select('id, venue_name, slug, category, city, region, country, hero_images, listing_type')
      .eq('status', 'live')
      .limit(200);

    (listings || []).forEach(l => {
      if (existingIds.has(l.id)) return;
      const name = (l.venue_name || '').toLowerCase();
      const loc  = [l.city, l.region, l.country].filter(Boolean).join(' ').toLowerCase();
      const haystack = `${name} ${loc}`;

      let score = 0;
      const matched = [];
      for (const term of terms) {
        if (stopWords.has(term)) continue;
        if (haystack.includes(term)) {
          score += term.length > 6 ? 3 : 1;
          matched.push(term);
        }
      }

      // Commercial boost
      const tier = l.listing_type || 'standard';
      score += TIER_WEIGHT[tier] || 0;

      // Same category boost
      if (categorySlug && l.category === categorySlug) score += 3;

      if (score >= 5) {
        const heroImgs = l.hero_images || [];
        const img = Array.isArray(heroImgs) && heroImgs.length > 0
          ? (typeof heroImgs[0] === 'string' ? heroImgs[0] : heroImgs[0]?.url || '')
          : '';

        suggestions.push({
          entityType: 'listing',
          entityId: l.id,
          slug: l.slug,
          label: l.venue_name,
          subtitle: [l.city, l.region].filter(Boolean).join(', '),
          image: img,
          url: `/${l.category || 'wedding-venues'}/${l.slug}`,
          tier,
          score,
          matchedTerms: matched,
          reason: matched.length > 0 ? `Matches: ${matched.slice(0, 3).join(', ')}` : `${tier} listing`,
        });
      }
    });
  } catch (_) {}

  // ── Showcases ──
  try {
    const { data: showcases } = await supabase
      .from('venue_showcases')
      .select('id, title, slug, location, hero_image_url, type')
      .eq('status', 'live')
      .limit(50);

    (showcases || []).forEach(s => {
      if (existingIds.has(s.id)) return;
      const haystack = `${(s.title || '').toLowerCase()} ${(s.location || '').toLowerCase()}`;

      let score = 0;
      const matched = [];
      for (const term of terms) {
        if (stopWords.has(term)) continue;
        if (haystack.includes(term)) {
          score += term.length > 6 ? 3 : 1;
          matched.push(term);
        }
      }
      score += TIER_WEIGHT.showcase;

      if (score >= 5) {
        suggestions.push({
          entityType: 'showcase',
          entityId: s.id,
          slug: s.slug,
          label: s.title,
          subtitle: s.location || '',
          image: s.hero_image_url || '',
          url: `/showcases/${s.slug}`,
          tier: 'showcase',
          score,
          matchedTerms: matched,
          reason: matched.length > 0 ? `Matches: ${matched.slice(0, 3).join(', ')}` : 'Showcase',
        });
      }
    });
  } catch (_) {}

  // ── Articles ──
  try {
    const { data: articles } = await supabase
      .from('magazine_posts')
      .select('id, title, slug, category_slug, category_label, excerpt, cover_image')
      .eq('published', true)
      .neq('id', currentPostId || '00000000-0000-0000-0000-000000000000')
      .limit(100);

    (articles || []).forEach(a => {
      if (existingIds.has(a.id)) return;
      const haystack = `${(a.title || '').toLowerCase()} ${(a.excerpt || '').toLowerCase()}`;

      let score = 0;
      const matched = [];
      for (const term of terms) {
        if (stopWords.has(term)) continue;
        if (haystack.includes(term)) {
          score += term.length > 6 ? 3 : 1;
          matched.push(term);
        }
      }

      if (categorySlug && a.category_slug === categorySlug) score += 2;

      if (score >= 4) {
        suggestions.push({
          entityType: 'article',
          entityId: a.id,
          slug: a.slug,
          label: a.title,
          subtitle: a.category_label || '',
          image: a.cover_image || '',
          url: `/magazine/${a.slug}`,
          tier: 'article',
          score,
          matchedTerms: matched,
          reason: matched.length > 0 ? `Matches: ${matched.slice(0, 3).join(', ')}` : 'Related article',
        });
      }
    });
  } catch (_) {}

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
}

// ── Reverse prospecting: find unlinked mentions ─────────────────────────────
// Scans all published articles for mentions of entities that don't have references yet.
// Returns potential sales leads (entities mentioned but not in directory).
export async function findUnlinkedMentions(entityName) {
  if (!entityName) return [];
  const { supabase } = await import('../lib/supabaseClient');

  try {
    const norm = entityName.toLowerCase();
    const { data: articles } = await supabase
      .from('magazine_posts')
      .select('id, title, slug, excerpt')
      .eq('published', true)
      .or(`title.ilike.%${norm}%,excerpt.ilike.%${norm}%`)
      .limit(20);

    return (articles || []).map(a => ({
      postId: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
    }));
  } catch (_) {
    return [];
  }
}

// ── Retroactive scanner: find articles that mention a listing ───────────────
// When a new listing joins, scan existing articles for mentions.
export async function retroactiveScan(listing) {
  if (!listing?.venueName) return [];
  const { supabase } = await import('../lib/supabaseClient');

  const searchTerms = [listing.venueName];
  if (listing.city) searchTerms.push(listing.city);

  try {
    // Search by venue name
    const { data: articles } = await supabase
      .from('magazine_posts')
      .select('id, title, slug, excerpt, cover_image, category_label, published_at')
      .eq('published', true)
      .ilike('title', `%${listing.venueName.toLowerCase()}%`)
      .limit(20);

    // Also search excerpt
    const { data: excerptMatches } = await supabase
      .from('magazine_posts')
      .select('id, title, slug, excerpt, cover_image, category_label, published_at')
      .eq('published', true)
      .ilike('excerpt', `%${listing.venueName.toLowerCase()}%`)
      .limit(20);

    // Dedupe
    const seen = new Set();
    const all = [...(articles || []), ...(excerptMatches || [])].filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });

    // Check which already have references
    const { data: existingRefs } = await supabase
      .from('article_references')
      .select('post_id')
      .eq('entity_id', listing.id)
      .eq('entity_type', 'listing');

    const refPostIds = new Set((existingRefs || []).map(r => r.post_id));

    return all
      .filter(a => !refPostIds.has(a.id))
      .map(a => ({
        postId: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        coverImage: a.cover_image,
        categoryLabel: a.category_label,
        publishedAt: a.published_at,
      }));
  } catch (_) {
    return [];
  }
}

// ── Get reference analytics for a post ──────────────────────────────────────
export async function getReferenceAnalytics(postId) {
  if (!postId) return { totalClicks: 0, references: [] };
  const { supabase } = await import('../lib/supabaseClient');

  const { data: refs } = await supabase
    .from('article_references')
    .select('*')
    .eq('post_id', postId)
    .order('click_count', { ascending: false });

  const totalClicks = (refs || []).reduce((sum, r) => sum + (r.click_count || 0), 0);

  return {
    totalClicks,
    references: (refs || []).map(r => ({
      id: r.id,
      label: r.entity_label,
      entityType: r.entity_type,
      tier: r.reference_tier,
      clicks: r.click_count || 0,
      lastClicked: r.last_clicked,
    })),
  };
}
