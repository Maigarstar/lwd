/**
 * magazineCommentsService.js
 * CRUD operations for magazine_page_comments table.
 */

import { supabase } from '../lib/supabaseClient';

const TABLE = 'magazine_page_comments';

/**
 * Fetch all comments for a specific page in an issue.
 * Returns top-level comments (parent_id IS NULL) ordered by created_at,
 * followed by replies for each.
 * @param {string} issueId
 * @param {number} pageNumber
 * @returns {{ data: Array, error: Error|null }}
 */
export async function fetchPageComments(issueId, pageNumber) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('issue_id', issueId)
      .eq('page_number', pageNumber)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Fetch all comments for an issue, ordered by page_number then created_at.
 * @param {string} issueId
 * @returns {{ data: Array, error: Error|null }}
 */
export async function fetchAllComments(issueId) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('issue_id', issueId)
      .order('page_number', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Add a new comment (or reply).
 * @param {{ issue_id, page_number, author_name, content, parent_id }} fields
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function addComment({ issue_id, page_number, author_name, content, parent_id }) {
  try {
    const payload = {
      issue_id,
      page_number,
      author_name: author_name || 'Admin',
      content,
    };
    if (parent_id) payload.parent_id = parent_id;

    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Mark a comment as resolved.
 * @param {string} id
 * @returns {{ error: Error|null }}
 */
export async function resolveComment(id) {
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({ resolved: true })
      .eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Delete a comment (and its replies via CASCADE).
 * @param {string} id
 * @returns {{ error: Error|null }}
 */
export async function deleteComment(id) {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Fetch comment counts per page for an issue.
 * Returns an object: { [pageNumber]: count }
 * @param {string} issueId
 * @returns {{ data: Object, error: Error|null }}
 */
export async function fetchCommentCountsByPage(issueId) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('page_number')
      .eq('issue_id', issueId)
      .eq('resolved', false);
    if (error) throw error;
    const counts = {};
    (data || []).forEach(r => {
      counts[r.page_number] = (counts[r.page_number] || 0) + 1;
    });
    return { data: counts, error: null };
  } catch (error) {
    return { data: {}, error };
  }
}
