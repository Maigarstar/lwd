/**
 * pageService — Supabase CRUD operations for pages
 *
 * Phase 3: Real Supabase CRUD implementation
 *
 * Persists complete page state including:
 * - Core page fields (title, slug, pageType, status)
 * - Section order and enabled state
 * - Section content (heading, subheading, etc.)
 * - Custom fields (id, type, label, enabled, value)
 * - SEO metadata
 * - Timestamps (updatedAt, publishedAt)
 */

import { supabase } from '../../../lib/supabaseClient';

/**
 * Create new page in Supabase
 * Inserts complete formData as JSON document
 */
export async function createPage(formData) {
  try {
    const pageRecord = {
      id: formData.id,
      title: formData.title,
      slug: formData.slug,
      page_type: formData.pageType,
      status: formData.status,
      content: { sections: formData.sections, excerpt: formData.excerpt || '' },
      seo: formData.seo,
      updated_at: formData.updatedAt,
      published_at: formData.publishedAt,
    };

    const { data, error } = await supabase
      .from('pages')
      .insert([pageRecord])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating page:', err);
    throw err;
  }
}

/**
 * Update existing page in Supabase
 * Updates all page fields including section order, custom fields, content
 */
export async function updatePage(pageId, formData) {
  try {
    const pageRecord = {
      id: pageId,
      title: formData.title,
      slug: formData.slug,
      page_type: formData.pageType,
      status: formData.status,
      content: { sections: formData.sections, excerpt: formData.excerpt || '' },
      seo: formData.seo,
      updated_at: formData.updatedAt,
      published_at: formData.publishedAt,
    };

    // Use upsert to handle case where page doesn't exist yet
    const { data, error } = await supabase
      .from('pages')
      .upsert([pageRecord], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      const errorInfo = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status,
      };
      console.error('Supabase upsert error:', JSON.stringify(errorInfo, null, 2));
      throw error;
    }
    return data;
  } catch (err) {
    const errorInfo = {
      message: err?.message,
      code: err?.code,
      details: err?.details,
      stack: err?.stack,
    };
    console.error('Error updating page:', JSON.stringify(errorInfo, null, 2));
    throw err;
  }
}

/**
 * Fetch page by ID from Supabase
 * Returns complete page data with all sections and custom fields
 */
export async function getPageById(pageId) {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return null for new pages
        return null;
      }
      throw error;
    }

    // Map database fields back to formData shape
    // Handle both old array format (sections only) and new object format ({ sections, excerpt })
    if (data) {
      const contentObj = Array.isArray(data.content)
        ? { sections: data.content, excerpt: '' }
        : data.content || { sections: [], excerpt: '' };

      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        pageType: data.page_type,
        status: data.status,
        sections: contentObj.sections || [],
        excerpt: contentObj.excerpt || '',
        seo: data.seo || { title: '', metaDescription: '', keywords: [] },
        updatedAt: data.updated_at,
        publishedAt: data.published_at,
      };
    }

    return null;
  } catch (err) {
    console.error('Error fetching page:', err);
    throw err;
  }
}

/**
 * Publish page (set status to 'published' and set published_at)
 */
export async function publishPage(pageId, formData) {
  try {
    const now = new Date().toISOString();
    const pageRecord = {
      title: formData.title,
      slug: formData.slug,
      page_type: formData.pageType,
      status: 'published',
      content: { sections: formData.sections, excerpt: formData.excerpt || '' },
      seo: formData.seo,
      updated_at: formData.updatedAt,
      published_at: now,
    };

    const { data, error } = await supabase
      .from('pages')
      .update(pageRecord)
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error publishing page:', err);
    throw err;
  }
}

/**
 * Delete page from Supabase
 */
export async function deletePage(pageId) {
  try {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting page:', err);
    throw err;
  }
}
