// ─── src/services/cmsService.js ───────────────────────────────────────────────
// CMS page CRUD — fetch, save draft, publish, versions, revert
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabaseClient';

// ── Public: fetch published page ──────────────────────────────────────────────
export async function fetchPage(pageKey) {
  const { data, error } = await supabase
    .from('cms_pages')
    .select('id, page_key, page_type, title, slug, seo_title, meta_description, summary, content_html, last_updated, status')
    .eq('page_key', pageKey)
    .eq('status', 'published')
    .single();

  if (error) throw error;
  return data;
}

// ── Admin / preview: fetch any page regardless of status ──────────────────────
export async function fetchPageDraft(pageKey) {
  const { data, error } = await supabase
    .from('cms_pages')
    .select('id, page_key, page_type, title, slug, seo_title, meta_description, summary, content_html, published_html, last_updated, status, created_at, updated_at')
    .eq('page_key', pageKey)
    .single();

  if (error) throw error;
  return data;
}

// ── Admin: fetch all pages (list view) ────────────────────────────────────────
export async function fetchAllPages() {
  const { data, error } = await supabase
    .from('cms_pages')
    .select('id, page_key, page_type, title, slug, status, last_updated, updated_at')
    .order('page_key', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ── Admin: auto-save draft (silent, debounced) ────────────────────────────────
export async function saveDraft(pageKey, updates) {
  const { data, error } = await supabase
    .from('cms_pages')
    .update({
      ...updates,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('page_key', pageKey)
    .select('id, page_key, status, updated_at')
    .single();

  if (error) throw error;
  return data;
}

// ── Admin: publish page ────────────────────────────────────────────────────────
// Sets status=published, copies content_html → published_html, auto-sets last_updated
// Saves a version snapshot to cms_page_versions
export async function publishPage(pageKey, contentHtml, meta = {}) {
  const now = new Date().toISOString();

  // 1. Update the page
  const { data: page, error: pageError } = await supabase
    .from('cms_pages')
    .update({
      content_html: contentHtml,
      published_html: contentHtml,
      status: 'published',
      last_updated: now,
      updated_at: now,
      ...(meta.title ? { title: meta.title } : {}),
      ...(meta.seo_title ? { seo_title: meta.seo_title } : {}),
      ...(meta.meta_description ? { meta_description: meta.meta_description } : {}),
    })
    .eq('page_key', pageKey)
    .select()
    .single();

  if (pageError) throw pageError;

  // 2. Snapshot to version history
  const versionLabel = `Published ${new Date(now).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  await supabase.from('cms_page_versions').insert({
    page_key: pageKey,
    content_html: contentHtml,
    title: page.title,
    version_label: versionLabel,
    created_by: 'admin',
  });

  return page;
}

// ── Admin: save draft with metadata ───────────────────────────────────────────
export async function saveDraftFull(pageKey, payload) {
  const { data, error } = await supabase
    .from('cms_pages')
    .update({
      content_html: payload.content_html,
      title: payload.title,
      seo_title: payload.seo_title,
      meta_description: payload.meta_description,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('page_key', pageKey)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Admin: fetch version history ─────────────────────────────────────────────
export async function fetchVersions(pageKey) {
  const { data, error } = await supabase
    .from('cms_page_versions')
    .select('id, page_key, version_label, title, created_at, created_by')
    .eq('page_key', pageKey)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

// ── Admin: restore a specific version ────────────────────────────────────────
export async function revertToVersion(pageKey, versionId) {
  // Get the version content
  const { data: version, error: vErr } = await supabase
    .from('cms_page_versions')
    .select('content_html, title')
    .eq('id', versionId)
    .single();

  if (vErr) throw vErr;

  // Update the page draft (does not publish — admin reviews before publishing)
  const { data, error } = await supabase
    .from('cms_pages')
    .update({
      content_html: version.content_html,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('page_key', pageKey)
    .select()
    .single();

  if (error) throw error;
  return { page: data, restoredHtml: version.content_html };
}

// ── Admin: revert to last published snapshot ─────────────────────────────────
export async function revertToLastPublished(pageKey) {
  // Get current published_html
  const { data: current, error: fetchErr } = await supabase
    .from('cms_pages')
    .select('published_html, title')
    .eq('page_key', pageKey)
    .single();

  if (fetchErr) throw fetchErr;
  if (!current.published_html) throw new Error('No published version found to revert to.');

  // Set content_html = published_html
  const { data, error } = await supabase
    .from('cms_pages')
    .update({
      content_html: current.published_html,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('page_key', pageKey)
    .select()
    .single();

  if (error) throw error;
  return { page: data, restoredHtml: current.published_html };
}

// ── AI content assist ─────────────────────────────────────────────────────────
// Calls the ai-content-assist Edge Function
export async function aiContentAssist({ action, content, selection, customPrompt, pageKey }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase not configured — cannot call AI service.');
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/ai-content-assist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      action,
      content,
      selection: selection || '',
      customPrompt: customPrompt || '',
      page_key: pageKey || '',
    }),
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || 'AI request failed');
  }

  return json.result;
}
