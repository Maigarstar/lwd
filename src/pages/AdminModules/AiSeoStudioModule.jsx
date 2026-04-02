/**
 * AiSeoStudioModule.jsx — AI SEO Studio v2
 *
 * Main component only. Sub-modules split into seo-studio/:
 *  - tokens.js    — design tokens, constants, helpers
 *  - ai.js        — callAI function
 *  - scoring.js   — quality scoring, audits, analysis
 *  - panels.jsx   — all React sub-components (UI panels)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchListingsSeoStatus,
  generateListingSeo,
  bulkGenerateSeo,
  generateArticleSeo,
  bulkGenerateArticleSeo,
  fetchPrimaryPages,
  setPrimaryPage,
} from '../../services/seoService';
import { fetchPosts } from '../../services/magazineService';
import {
  buildSeoTitlePrompt,
  buildSeoDescriptionPrompt,
  buildSeoKeywordsPrompt,
} from '../../lib/aiPrompts';

// ── Split sub-modules ────────────────────────────────────────────────────────
import { GD, NU, G, RAIL_W, ENTITY_TYPES, parseKeywords, getEntityTitle, getEntityDesc, addScoreHistory, getLastScore, gradeColor } from './seo-studio/tokens';
import { computeQualityScore, computeFleschKincaid, checkSchemaOrg, computeFocusKeywordChecks, computePageAudit, detectCannibalisation, suggestInternalLinks, analyseCTR, exportEntitiesCsv } from './seo-studio/scoring';
import { SeoStudioErrorBoundary, Toast, SerpPreview, SocialPreview, ScoreRing, FieldRow, KeywordsEditor, OgImageField, RecommendationsPanel, CompetitorInsightsPanel, PageAuditPanel, CannibalisationPanel, InternalLinksPanel, CTRPanel, PriorityActionsPanel, OutrankPanel, ComparisonPicker } from './seo-studio/panels';
import { callAI } from './seo-studio/ai';

// ═════════════════════════════════════════════════════════════════════════════
// ── Main Component ───────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function AiSeoStudioModule({ C }) {
  // ── Dark mode ─────────────────────────────────────────────────────────────
  const DK = C?.bg === '#1a1a1a' || C?.bg === '#111' || C?.bg === '#0f0f0f' || (C?.bg && (C.bg.startsWith('#0') || C.bg.startsWith('#1')));

  // ── Responsive ────────────────────────────────────────────────────────────
  const [winWidth, setWinWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = winWidth < 768;
  const isTablet = winWidth >= 768 && winWidth <= 1024;
  const railWidth = isMobile ? 0 : isTablet ? 260 : RAIL_W;

  const [entityType, setEntityType] = useState('listing');
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [draft, setDraft] = useState({});
  const [preDraft, setPreDraft] = useState({}); // snapshot before AI generation (for undo)
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingField, setGeneratingField] = useState(null);

  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [generating, setGenerating] = useState(false);
  const [crossTypeLoading, setCrossTypeLoading] = useState(false);

  // Fix All tracking: which action is being fixed, which have been resolved
  const [fixingAction, setFixingAction] = useState(null);
  const [recentlyFixed, setRecentlyFixed] = useState(new Set());
  const [savePulse, setSavePulse] = useState(false);

  // Focus keyword (per-entity, local analysis only)
  const [focusKeyword, setFocusKeyword] = useState('');

  // Slug editor
  const [editingSlug, setEditingSlug] = useState(null); // null = not editing, string = current edited slug
  const [savingSlug, setSavingSlug] = useState(false);

  // Competitor analysis
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorCollapsed, setCompetitorCollapsed] = useState(false);

  // AI Comparison Mode (Feature 5)
  const [aiComparisons, setAiComparisons] = useState(null); // { field, current, options: [string, string] }
  const [useComparisonMode, setUseComparisonMode] = useState(true);
  const [fixAllRunning, setFixAllRunning] = useState(false);
  const [primaryPages, setPrimaryPages] = useState({});

  // Cross-type entity cache for cannibalisation/linking (Features 2 & 3)
  const [crossTypeEntities, setCrossTypeEntities] = useState({ listing: [], showcase: [], article: [] });

  const [toast, setToast] = useState(null);
  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  // ── Fetch entities ─────────────────────────────────────────────────────────
  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      if (entityType === 'listing') {
        const rows = await fetchListingsSeoStatus();
        setEntities(rows);
      } else if (entityType === 'showcase') {
        const { data } = await supabase
          .from('venue_showcases')
          .select('id, title, slug, status, seo_title, seo_description, og_image, hero_image_url, excerpt, location')
          .order('title', { ascending: true });
        setEntities(data || []);
      } else if (entityType === 'article') {
        const result = await fetchPosts();
        setEntities(result?.data || []);
      }
    } catch (err) {
      console.error('[AiSeoStudio] fetch error:', err);
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [entityType, notify]);

  // ── Load cross-type entities for cannibalisation/linking (once per type switch) ──
  const crossTypeFetchedRef = useRef(null);
  useEffect(() => {
    // Only re-fetch cross-types when entityType changes, not on every entity update
    if (crossTypeFetchedRef.current === entityType || entities.length === 0) {
      return;
    }
    let cancelled = false;
    setCrossTypeLoading(true);
    async function loadCrossTypes() {
      try {
        const [listRes, scRes, artRes] = await Promise.all([
          entityType !== 'listing' ? fetchListingsSeoStatus().catch(() => []) : Promise.resolve([]),
          entityType !== 'showcase' ? supabase.from('venue_showcases').select('id, title, slug, seo_title, seo_description, og_image, hero_image_url, excerpt, location').order('title', { ascending: true }).then(r => r.data || []).catch(() => []) : Promise.resolve([]),
          entityType !== 'article' ? fetchPosts().then(r => r?.data || []).catch(() => []) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setCrossTypeEntities({ listing: listRes, showcase: scRes, article: artRes });
          crossTypeFetchedRef.current = entityType;
          setCrossTypeLoading(false);
        }
      } catch {
        if (!cancelled) setCrossTypeLoading(false);
      }
    }
    loadCrossTypes();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entities.length > 0]);

  // Combined map always stays current for the active type
  const allEntitiesMap = useMemo(() => ({
    ...crossTypeEntities,
    [entityType]: entities,
  }), [crossTypeEntities, entities, entityType]);

  // ── Unsaved changes: dirty check wrapper ──────────────────────────────────
  const confirmIfDirty = useCallback((action) => {
    if (dirty) {
      if (!window.confirm('You have unsaved changes. Discard?')) return false;
    }
    action();
    return true;
  }, [dirty]);

  useEffect(() => {
    if (dirty) {
      const handler = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [dirty]);

  useEffect(() => {
    confirmIfDirty(() => {
      setSelected(null);
      setDraft({});
      setPreDraft({});
      setDirty(false);
    });
    fetchEntities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEntities]);

  // ── Load DB-backed primary page designations ──────────────────────────────
  useEffect(() => {
    fetchPrimaryPages()
      .then(setPrimaryPages)
      .catch(err => console.warn('[AiSeoStudio] Failed to load primary pages:', err.message));
  }, []);

  // ── Select entity -> populate draft ─────────────────────────────────────────
  const selectEntity = useCallback((entity) => {
    const doSelect = () => {
      setSelected(entity);
      setDirty(false);
      setFocusKeyword('');
      setEditingSlug(null);
      setCompetitorAnalysis(null);
      setCompetitorLoading(false);
      setCompetitorCollapsed(false);
      setAiComparisons(null);
      let d;
      if (entityType === 'listing') {
        d = { seo_title: entity.seo_title || '', seo_description: entity.seo_description || '', seo_keywords: parseKeywords(entity.seo_keywords) };
      } else if (entityType === 'showcase') {
        d = { seo_title: entity.seo_title || '', seo_description: entity.seo_description || '', og_image: entity.og_image || '', canonical_url: entity.canonical_url || '' };
      } else {
        d = { seo_title: entity.seoTitle || entity.seo_title || '', meta_description: entity.metaDescription || entity.meta_description || '', og_image: entity.ogImage || entity.og_image || '', canonical_url: entity.canonical_url || '' };
      }
      setDraft(d);
      setPreDraft(d);
    };
    if (dirty) {
      if (!window.confirm('You have unsaved changes. Discard?')) return;
    }
    doSelect();
  }, [entityType, dirty]);

  // ── Entity type switch with dirty check ───────────────────────────────────
  const switchEntityType = useCallback((newType) => {
    if (newType === entityType) return;
    if (dirty) {
      if (!window.confirm('You have unsaved changes. Discard?')) return;
    }
    setEntityType(newType);
  }, [entityType, dirty]);

  const updateDraft = (key, value) => { setDraft(prev => ({ ...prev, [key]: value })); setDirty(true); };

  // ── Prev/Next navigation ───────────────────────────────────────────────────
  const filteredEntitiesRef = useRef([]);

  const selectedIdx = useMemo(() => {
    if (!selected) return -1;
    return filteredEntitiesRef.current.findIndex(e => e.id === selected.id);
  }, [selected]);

  const navigatePrev = useCallback(() => {
    const list = filteredEntitiesRef.current;
    if (selectedIdx > 0) selectEntity(list[selectedIdx - 1]);
  }, [selectedIdx, selectEntity]);

  const navigateNext = useCallback(() => {
    const list = filteredEntitiesRef.current;
    if (selectedIdx < list.length - 1) selectEntity(list[selectedIdx + 1]);
  }, [selectedIdx, selectEntity]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  const handleSaveRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      // Ctrl+S / Cmd+S -> save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (handleSaveRef.current) handleSaveRef.current();
        return;
      }
      // Alt+Left -> prev
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePrev();
        return;
      }
      // Alt+Right -> next
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigateNext();
        return;
      }
      // Escape -> deselect
      if (e.key === 'Escape') {
        if (dirty) {
          if (!window.confirm('You have unsaved changes. Discard?')) return;
        }
        setSelected(null);
        setDirty(false);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigatePrev, navigateNext, dirty]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selected?.id) return;
    setSaving(true);
    try {
      if (entityType === 'listing') {
        const { error } = await supabase.from('listings')
          .update({ seo_title: draft.seo_title || null, seo_description: draft.seo_description || null, seo_keywords: draft.seo_keywords || [] })
          .eq('id', selected.id);
        if (error) throw new Error(error.message);
      } else if (entityType === 'showcase') {
        const payload = { id: selected.id, seoTitle: draft.seo_title || null, seoDescription: draft.seo_description || null, ogImage: draft.og_image || null };
        if (draft.canonical_url !== undefined) payload.canonicalUrl = draft.canonical_url || null;
        const resp = await fetch(`https://qpkggfibwreznussudfh.supabase.co/functions/v1/update-showcase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}` },
          body: JSON.stringify(payload),
        });
        const result = await resp.json();
        if (!resp.ok || !result.success) throw new Error(result.error || 'Save failed');
      } else if (entityType === 'article') {
        const updatePayload = { seo_title: draft.seo_title || null, meta_description: draft.meta_description || null, og_image: draft.og_image || null };
        if (draft.canonical_url !== undefined) updatePayload.canonical_url = draft.canonical_url || null;
        const { error } = await supabase.from('magazine_posts')
          .update(updatePayload)
          .eq('id', selected.id);
        if (error) throw new Error(error.message);
      }
      const merged = entityType === 'article'
        ? { ...draft, seoTitle: draft.seo_title, metaDescription: draft.meta_description, ogImage: draft.og_image }
        : draft;
      setEntities(prev => prev.map(e => e.id === selected.id ? { ...e, ...merged } : e));
      setSelected(prev => ({ ...prev, ...merged }));
      setPreDraft(draft);
      setDirty(false);

      // Store score history
      if (quality) {
        addScoreHistory(selected.id, quality.score);
      }

      // Score delta feedback
      const oldScore = entityScoresMap.get(selected.id)?.score || 0;
      const updatedEntity = { ...selected };
      if (entityType === 'listing') {
        updatedEntity.seo_title = draft.seo_title;
        updatedEntity.seo_description = draft.seo_description;
        updatedEntity.seo_keywords = draft.seo_keywords;
      } else if (entityType === 'article') {
        updatedEntity.seo_title = draft.seo_title;
        updatedEntity.meta_description = draft.meta_description;
      } else {
        updatedEntity.seo_title = draft.seo_title;
        updatedEntity.seo_description = draft.seo_description;
      }
      const newQ = computeQualityScore(updatedEntity, entityType, entities);
      if (newQ.score !== oldScore) {
        notify(`Score: ${oldScore} \u2192 ${newQ.score} (${newQ.score > oldScore ? '+' : ''}${newQ.score - oldScore} points)`);
      } else {
        notify('Saved successfully');
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Keep ref updated for keyboard shortcut
  handleSaveRef.current = handleSave;

  // ── AI Generate single field ───────────────────────────────────────────────
  const generateField = async (field) => {
    if (!selected) return;
    setGeneratingField(field);
    // Snapshot current draft for undo
    setPreDraft({ ...draft });
    try {
      const name = selected.name || selected.title || 'Page';
      // Helper: either set comparison or apply directly
      const applyOrCompare = async (draftKey, prompt1, feature1, prompt2Suffix) => {
        const val1 = await callAI(feature1, prompt1);
        if (useComparisonMode && field !== 'keywords') {
          const altPrompt = prompt1 + (prompt2Suffix || ' Provide a different creative angle.');
          const val2 = await callAI(feature1, altPrompt);
          setAiComparisons({ field: draftKey, current: draft[draftKey] || '', options: [val1, val2] });
        } else {
          updateDraft(draftKey, val1);
        }
      };
      if (entityType === 'listing') {
        const venueData = { location: [selected.city, selected.region, selected.country].filter(Boolean).join(', '), destination: selected.country || null, style: selected.venue_type || null, highlights: [] };
        if (field === 'title') { await applyOrCompare('seo_title', buildSeoTitlePrompt(name, venueData), 'seo_title'); }
        else if (field === 'desc') { await applyOrCompare('seo_description', buildSeoDescriptionPrompt(name, venueData), 'seo_description'); }
        else if (field === 'keywords') { updateDraft('seo_keywords', (await callAI('seo_keywords', buildSeoKeywordsPrompt(name, venueData))).split(',').map(k => k.trim()).filter(Boolean)); }
      } else if (entityType === 'showcase') {
        const ctx = `"${name}". Location: ${selected.location || 'luxury destination'}. Excerpt: ${selected.excerpt || ''}`;
        if (field === 'title') await applyOrCompare('seo_title', `Generate an SEO title (50-60 chars) for this luxury wedding venue showcase page: ${ctx}. Return ONLY the title text.`, 'seo');
        else await applyOrCompare('seo_description', `Generate an SEO meta description (150-160 chars) for this luxury wedding venue showcase page: ${ctx}. Return ONLY the description text.`, 'seo');
      } else {
        const ctx = `"${name}". Category: ${selected.categoryLabel || selected.categorySlug || selected.category_label || selected.category_slug || ''}`;
        if (field === 'title') await applyOrCompare('seo_title', `Generate an SEO title (50-60 chars) for this luxury wedding magazine article: ${ctx}. Return ONLY the title text.`, 'seo');
        else await applyOrCompare('meta_description', `Generate an SEO meta description (150-160 chars) for this luxury wedding magazine article: ${ctx}. Return ONLY the description text.`, 'seo');
      }
      notify(`Generated ${field}`);
    } catch (err) { notify(err.message, 'error'); }
    finally { setGeneratingField(null); }
  };

  // ── AI Generate all ────────────────────────────────────────────────────────
  const generateAll = async () => {
    if (!selected) return;
    setGeneratingField('all');
    setPreDraft({ ...draft });
    try {
      if (entityType === 'listing') {
        const updated = await generateListingSeo(selected);
        setDraft({ seo_title: updated.seo_title || '', seo_description: updated.seo_description || '', seo_keywords: parseKeywords(updated.seo_keywords) });
        setEntities(prev => prev.map(e => e.id === selected.id ? updated : e));
        setSelected(prev => ({ ...prev, ...updated }));
        setDirty(false);
      } else if (entityType === 'article') {
        const updated = await generateArticleSeo(selected);
        setDraft({ seo_title: updated.seo_title || '', meta_description: updated.meta_description || '', og_image: draft.og_image || '' });
        setEntities(prev => prev.map(e => e.id === selected.id ? { ...e, ...updated } : e));
        setSelected(prev => ({ ...prev, ...updated }));
        setDirty(false);
      } else {
        await generateField('title');
        await generateField('desc');
      }
      notify('All SEO fields generated');
    } catch (err) { notify(err.message, 'error'); }
    finally { setGeneratingField(null); }
  };

  // ── Undo helpers ───────────────────────────────────────────────────────────
  const undoField = (key) => { if (preDraft[key] !== undefined) updateDraft(key, preDraft[key]); };
  const undoAll = () => { setDraft({ ...preDraft }); setDirty(false); };

  // ── Competitor Analysis ───────────────────────────────────────────────────
  const runCompetitorAnalysis = async () => {
    if (!selected || competitorLoading) return;
    setCompetitorLoading(true);
    setCompetitorCollapsed(false);
    try {
      const name = selected.name || selected.title || 'Page';
      const location = selected.city || selected.location || selected.region || '';
      const category = selected.venue_type || selected.categoryLabel || selected.category_label || entityType;
      const searchQuery = [name, location, category].filter(Boolean).join(' ');

      const prompt = `You are an SEO competitor analyst for the luxury wedding industry.

Target entity: "${name}"
Location: ${location || 'Not specified'}
Category: ${category || 'luxury wedding'}
Likely search query: "${searchQuery}"

Analyse what top Google results would typically look like for this search query. Return your analysis as a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):
{
  "searchQuery": "the likely search query users would type",
  "patterns": [
    "Pattern 1: what top-ranking titles typically include",
    "Pattern 2: common description patterns",
    "Pattern 3: common keyword themes"
  ],
  "suggestions": [
    "Specific actionable suggestion 1 to outrank competitors",
    "Specific actionable suggestion 2",
    "Specific actionable suggestion 3"
  ],
  "competitorTitles": [
    "Example competitor title 1 (50-60 chars)",
    "Example competitor title 2 (50-60 chars)",
    "Example competitor title 3 (50-60 chars)"
  ]
}

Make the suggestions specific and actionable (e.g. "Add location to title", "Include pricing language", "Use power words like exclusive or bespoke"). Generate realistic competitor titles that would rank well.`;

      const raw = await callAI('seo', prompt);
      // Parse JSON from the response
      let parsed;
      try {
        // Try to extract JSON from the response (might be wrapped in code fences)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch {
        // Fallback: create a basic structure from the text
        parsed = {
          searchQuery,
          patterns: ['Could not parse structured analysis -- see raw output below'],
          suggestions: [raw.slice(0, 300)],
          competitorTitles: [],
        };
      }
      setCompetitorAnalysis(parsed);
    } catch (err) {
      notify('Competitor analysis failed: ' + err.message, 'error');
    } finally {
      setCompetitorLoading(false);
    }
  };

  // ── Save Slug ─────────────────────────────────────────────────────────────
  const handleSaveSlug = async () => {
    if (!selected?.id || editingSlug === null) return;
    const newSlug = editingSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!newSlug) { notify('Slug cannot be empty', 'error'); return; }
    setSavingSlug(true);
    try {
      if (entityType === 'listing') {
        const { error } = await supabase.from('listings').update({ slug: newSlug }).eq('id', selected.id);
        if (error) throw new Error(error.message);
      } else if (entityType === 'showcase') {
        const resp = await fetch(`https://qpkggfibwreznussudfh.supabase.co/functions/v1/update-showcase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}` },
          body: JSON.stringify({ id: selected.id, slug: newSlug }),
        });
        const result = await resp.json();
        if (!resp.ok || !result.success) throw new Error(result.error || 'Save failed');
      } else if (entityType === 'article') {
        const { error } = await supabase.from('magazine_posts').update({ slug: newSlug }).eq('id', selected.id);
        if (error) throw new Error(error.message);
      }
      setEntities(prev => prev.map(e => e.id === selected.id ? { ...e, slug: newSlug } : e));
      setSelected(prev => ({ ...prev, slug: newSlug }));
      setEditingSlug(null);
      notify('Slug updated');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingSlug(false);
    }
  };

  // ── Bulk generate ──────────────────────────────────────────────────────────
  const handleBulk = async () => {
    setBulkRunning(true);
    try {
      if (entityType === 'listing') {
        const result = await bulkGenerateSeo(entities, {
          onProgress: (cur, tot) => setBulkProgress({ current: cur, total: tot }),
          onListingDone: (id, updated) => { if (updated) setEntities(prev => prev.map(e => e.id === id ? updated : e)); },
        });
        notify(`Generated ${result.generated}, failed ${result.failed}`);
      } else if (entityType === 'article') {
        const result = await bulkGenerateArticleSeo(entities, {
          onProgress: (cur, tot) => setBulkProgress({ current: cur, total: tot }),
          onArticleDone: (id, updated) => { if (updated) setEntities(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e)); },
        });
        notify(`Generated ${result.generated}, failed ${result.failed}`);
      } else if (entityType === 'showcase') {
        const targets = entities.filter(e => !e.seo_title?.trim() || !e.seo_description?.trim());
        let generated = 0, failed = 0;
        for (let i = 0; i < targets.length; i++) {
          const sc = targets[i];
          setBulkProgress({ current: i + 1, total: targets.length });
          try {
            const name = sc.title || sc.name || 'Showcase';
            const ctx = `"${name}". Location: ${sc.location || 'luxury destination'}. Excerpt: ${sc.excerpt || ''}`;
            const titlePrompt = `Generate an SEO title (50-60 chars) for this luxury wedding venue showcase page: ${ctx}. Return ONLY the title text.`;
            const descPrompt = `Generate an SEO meta description (150-160 chars) for this luxury wedding venue showcase page: ${ctx}. Return ONLY the description text.`;
            const seoTitle = (!sc.seo_title?.trim()) ? await callAI('seo', titlePrompt) : sc.seo_title;
            if (!sc.seo_title?.trim()) await new Promise(r => setTimeout(r, 400));
            const seoDesc = (!sc.seo_description?.trim()) ? await callAI('seo', descPrompt) : sc.seo_description;
            // Save via edge function
            const resp = await fetch(`https://qpkggfibwreznussudfh.supabase.co/functions/v1/update-showcase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}` },
              body: JSON.stringify({ id: sc.id, seoTitle, seoDescription: seoDesc }),
            });
            const result = await resp.json();
            if (resp.ok && result.success) {
              generated++;
              setEntities(prev => prev.map(e => e.id === sc.id ? { ...e, seo_title: seoTitle, seo_description: seoDesc } : e));
            } else { failed++; }
          } catch { failed++; }
          if (i < targets.length - 1) await new Promise(r => setTimeout(r, 600));
        }
        notify(`Generated ${generated}, failed ${failed}`);
      }
    } catch (err) { notify(err.message, 'error'); }
    finally { setBulkRunning(false); setBulkProgress({ current: 0, total: 0 }); }
  };

  // ── Bulk improve weak pages ─────────────────────────────────────────────────
  const handleBulkImprove = async () => {
    const targets = entities.filter(e => {
      const s = entityScoresMap.get(e.id)?.score || 0;
      return s < 90 && s > 0; // Has content but needs improvement
    });
    if (targets.length === 0) { notify('All pages score 90+', 'success'); return; }

    setBulkRunning(true);
    let improved = 0, failed = 0;

    for (let i = 0; i < targets.length; i++) {
      const entity = targets[i];
      setBulkProgress({ current: i + 1, total: targets.length });

      try {
        const name = entity.name || entity.title || '';
        const location = entity.city ? [entity.city, entity.region, entity.country].filter(Boolean).join(', ') : '';
        const currentTitle = getEntityTitle(entity, entityType);
        const currentDesc = getEntityDesc(entity, entityType);
        const eScore = entityScoresMap.get(entity.id)?.score || 0;
        const eIssues = entityScoresMap.get(entity.id)?.issues || [];

        const issueList = eIssues.map(iss => iss.msg).join('; ');

        const prompt = `Improve the SEO metadata for this luxury wedding ${entityType}. Current score: ${eScore}/100.

Name: ${name}${location ? `\nLocation: ${location}` : ''}
Current title: ${currentTitle}
Current description: ${currentDesc}
Issues: ${issueList}

Return ONLY valid JSON: {"title": "improved title (50-60 chars)", "description": "improved description (140-160 chars)"}

Rules: Keep the entity name. Add location if missing. Add a CTA verb. Fix all listed issues. Sound premium and compelling.`;

        const raw = await callAI('seo', prompt);
        // Try multiple JSON extraction strategies
        let parsed;
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        } catch (parseErr) {
          const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
          const match2 = cleaned.match(/\{[\s\S]*\}/);
          if (match2) parsed = JSON.parse(match2[0]);
        }
        if (parsed && (parsed.title || parsed.description)) {
          const updates = {};
          if (entityType === 'listing') {
            if (parsed.title) updates.seo_title = parsed.title;
            if (parsed.description) updates.seo_description = parsed.description;
          } else {
            if (parsed.title) updates.seo_title = parsed.title;
            if (parsed.description) updates.meta_description = parsed.description;
          }

          // Save to DB
          if (entityType === 'showcase') {
            const resp = await fetch(`https://qpkggfibwreznussudfh.supabase.co/functions/v1/update-showcase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}` },
              body: JSON.stringify({ id: entity.id, seoTitle: updates.seo_title, seoDescription: updates.seo_description || updates.meta_description }),
            });
            const result = await resp.json();
            if (resp.ok && result.success) {
              improved++;
              setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, ...updates } : e));
            } else { failed++; }
          } else {
            const { error } = await supabase
              .from(entityType === 'listing' ? 'listings' : 'magazine_posts')
              .update(updates)
              .eq('id', entity.id);
            if (!error) {
              improved++;
              setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, ...updates } : e));
            } else { failed++; }
          }
        } else { failed++; }
      } catch (err) {
        console.error(`Bulk improve failed for ${entity.name || entity.title}:`, err);
        failed++;
      }

      // Rate limit
      if (i < targets.length - 1) await new Promise(r => setTimeout(r, 600));
    }

    setBulkRunning(false);
    setBulkProgress({ current: 0, total: 0 });
    notify(`Improved ${improved}, failed ${failed}`);
  };

  // ── Quick Fix: one-click AI fix for a specific issue ──────────────────────
  const handleQuickFix = useCallback(async (field, issue) => {
    if (!selected || generating) return;
    setGenerating(true);
    const actionId = issue?.id || `q-${field}-${(issue?.msg || '').slice(0, 20)}`;
    setFixingAction(actionId);
    try {
      const name = selected.name || selected.title || '';
      const descField = entityType === 'article' ? 'meta_description' : 'seo_description';

      if (field === 'title') {
        const currentTitle = draft.seo_title || '';
        const location = selected.city ? [selected.city, selected.region, selected.country].filter(Boolean).join(', ') : (selected.location || '');
        const prompt = `Rewrite this SEO title to fix: ${issue.msg}

Current title: "${currentTitle}"
Entity name: ${name}${location ? `\nLocation: ${location}` : ''}

Requirements:
- 50-60 characters
- Include entity name
- Include location if available
- Sound premium and compelling

Return ONLY the new title text, nothing else.`;
        const result = await callAI('seo_title', prompt);
        if (result) {
          updateDraft('seo_title', result.replace(/^["']|["']$/g, '').trim());
          notify('Title fixed');
        }
      } else if (field === 'desc') {
        const currentDesc = draft[descField] || '';
        const prompt = `Rewrite this meta description to fix: ${issue.msg}

Current description: "${currentDesc}"
Entity name: ${name}

Requirements:
- 140-160 characters
- Include a call-to-action (Discover, Explore, Book, Experience)
- Mention the entity name
- Sound premium and compelling

Return ONLY the new description text, nothing else.`;
        const result = await callAI('seo_description', prompt);
        if (result) {
          updateDraft(descField, result.replace(/^["']|["']$/g, '').trim());
          notify('Description fixed');
        }
      } else if (field === 'keywords') {
        const location = selected.city ? [selected.city, selected.region, selected.country].filter(Boolean).join(', ') : '';
        const venueType = selected.venue_type || '';
        const prompt = `Generate 6 SEO keywords for: ${name}${location ? ` in ${location}` : ''}${venueType ? `, ${venueType}` : ''}

Requirements:
- Long-tail, specific keywords
- Include location variants
- Include venue/entity type
- Luxury wedding focused

Return ONLY a comma-separated list, nothing else.`;
        const result = await callAI('seo_keywords', prompt);
        if (result) {
          const keywords = result.split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          updateDraft('seo_keywords', keywords);
          notify(`${keywords.length} keywords generated`);
        }
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGenerating(false);
      setRecentlyFixed(prev => new Set(prev).add(actionId));
      setTimeout(() => setRecentlyFixed(prev => { const next = new Set(prev); next.delete(actionId); return next; }), 2000);
      setFixingAction(null);
    }
  }, [selected, generating, draft, entityType, updateDraft, notify]);

  // ── Cannibalisation resolution ──────────────────────────────────────────────
  const handleCannibalResolve = useCallback(async (action, conflict) => {
    if (!selected || generating) return;
    setGenerating(true);
    setFixingAction(`cannibal-${action}`);
    try {
      const name = selected.name || selected.title || '';
      const currentTitle = draft.seo_title || '';
      const descField = entityType === 'article' ? 'meta_description' : 'seo_description';
      const currentDesc = draft[descField] || '';

      if (action === 'differentiate') {
        const prompt = `This page competes with "${conflict.name}" (${conflict.type}). Rewrite the SEO title and description to differentiate this page's angle.

Current title: "${currentTitle}"
Current description: "${currentDesc}"
Competing page: ${conflict.name} (${conflict.reason})

Create a UNIQUE angle that doesn't overlap. Return ONLY valid JSON:
{"title": "new differentiated title (50-60 chars)", "description": "new differentiated description (140-160 chars)"}`;
        const raw = await callAI('seo', prompt);
        const match = raw.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.title) updateDraft('seo_title', parsed.title);
          if (parsed.description) updateDraft(descField, parsed.description);
          notify('Differentiated from ' + conflict.name);
        }
      } else if (action === 'keyword') {
        const prompt = `This page "${name}" competes with "${conflict.name}". Suggest a different focus keyword that avoids overlap.

Current title: "${currentTitle}"
Competing page: ${conflict.name}

Return ONLY the suggested keyword phrase (2-4 words), nothing else.`;
        const result = await callAI('seo', prompt);
        if (result) {
          setFocusKeyword(result.replace(/^["']|["']$/g, '').trim());
          notify('Focus keyword updated: ' + result.trim());
        }
      } else if (action === 'primary') {
        // Persist primary page designation to DB
        const entityName = selected.name || selected.title || '';
        const conflictKey = `${conflict.type}-${conflict.slug || conflict.name}`;
        const saved = await setPrimaryPage(conflictKey, selected.id, entityName, entityType, conflict);
        setPrimaryPages(prev => ({ ...prev, [conflictKey]: saved }));
        // Set focus keyword to differentiate
        if (!focusKeyword) {
          const suggestedKw = entityName.split(' ').slice(0, 3).join(' ').toLowerCase();
          setFocusKeyword(suggestedKw);
        }
        notify(`Set as primary over "${conflict.name}". Focus keyword updated.`);
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGenerating(false);
      setFixingAction(null);
    }
  }, [selected, generating, draft, entityType, updateDraft, notify, focusKeyword]);

  // ── Internal link insertion ──────────────────────────────────────────────────
  const handleInsertLink = useCallback(async (suggestion) => {
    if (!selected || generating) return;
    setGenerating(true);
    setFixingAction('insert-link');
    try {
      const descField = entityType === 'article' ? 'meta_description' : 'seo_description';
      const currentDesc = draft[descField] || '';

      if (currentDesc.length > 100) {
        const prompt = `Add a brief internal link reference to "${suggestion.targetName}" (${suggestion.url}) at the end of this description. Keep total under 160 chars.

Current description: "${currentDesc}"

Return ONLY the updated description text.`;
        const result = await callAI('seo', prompt);
        if (result) {
          updateDraft(descField, result.replace(/^["']|["']$/g, '').trim());
          notify('Link context added to description');
        }
      } else {
        const addition = ` Explore ${suggestion.targetName}.`;
        updateDraft(descField, (currentDesc + addition).trim());
        notify('Link reference added');
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setGenerating(false);
      setFixingAction(null);
    }
  }, [selected, generating, draft, entityType, updateDraft, notify]);

  // Pre-compute scores once for all entities (avoids recalculating per-filter, per-stat, per-render)
  // MUST be declared before handleFixAll which references it in its dependency array
  const entityScoresMap = useMemo(() => {
    const map = new Map();
    entities.forEach(e => map.set(e.id, computeQualityScore(e, entityType, entities)));
    return map;
  }, [entities, entityType]);

  // ── Fix All: sequential quick fix for all actionable Priority Actions ──
  const handleFixAll = useCallback(async (actions) => {
    if (!selected || generating || fixAllRunning) return;
    setFixAllRunning(true);
    const scoreBefore = entityScoresMap.get(selected.id)?.score || 0;
    let fixedCount = 0;
    for (const action of actions) {
      if (action.actionable && action.field) {
        try {
          await handleQuickFix(action.field, action);
          fixedCount++;
        } catch { /* individual fix handles its own errors */ }
        await new Promise(r => setTimeout(r, 300));
      }
    }
    setFixAllRunning(false);
    // Compute new score from current draft for summary
    if (selected && fixedCount > 0) {
      notify(`Fixed ${fixedCount} issue${fixedCount > 1 ? 's' : ''}. Save to update score.`);
    }
  }, [selected, generating, fixAllRunning, handleQuickFix, entityScoresMap, notify]);

  // ── Filtered + stats ───────────────────────────────────────────────────────
  const filteredEntities = useMemo(() => {
    let list = entities;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const n = (e.name || e.title || '').toLowerCase();
        return n.includes(q) || (e.slug || '').toLowerCase().includes(q);
      });
    }
    if (filter !== 'all') {
      list = list.filter(e => {
        const s = entityScoresMap.get(e.id)?.score || 0;
        return filter === 'complete' ? s >= 90 : s < 90;
      });
    }
    filteredEntitiesRef.current = list;
    return list;
  }, [entities, search, filter, entityType, entityScoresMap]);

  const stats = useMemo(() => {
    const total = entities.length;
    let strongCount = 0, scoreSum = 0;
    entities.forEach(e => {
      const s = entityScoresMap.get(e.id)?.score || 0;
      if (s >= 90) strongCount++;
      scoreSum += s;
    });
    // bulkTargets = entities missing SEO title or description (matches bulkGenerateSeo filter)
    const bulkTargets = entityType === 'listing'
      ? entities.filter(e => !e.seo_title?.trim() || !e.seo_description?.trim()).length
      : entityType === 'article'
        ? entities.filter(e => !e.seo_title?.trim() || !e.meta_description?.trim()).length
        : entityType === 'showcase'
          ? entities.filter(e => !e.seo_title?.trim() || !e.seo_description?.trim()).length
          : 0;
    return { total, strong: strongCount, weak: total - strongCount, avg: total > 0 ? Math.round(scoreSum / total) : 0, bulkTargets };
  }, [entities, entityScoresMap, entityType]);

  // ── Quality for selected entity ────────────────────────────────────────────
  const quality = useMemo(() => {
    if (!selected) return null;
    // Build a temporary entity with draft values for live scoring
    const draftEntity = { ...selected };
    if (entityType === 'listing') {
      draftEntity.seo_title = draft.seo_title;
      draftEntity.seo_description = draft.seo_description;
      draftEntity.seo_keywords = draft.seo_keywords;
    } else if (entityType === 'showcase') {
      draftEntity.seo_title = draft.seo_title;
      draftEntity.seo_description = draft.seo_description;
      draftEntity.og_image = draft.og_image;
    } else {
      draftEntity.seoTitle = draft.seo_title;
      draftEntity.metaDescription = draft.meta_description;
      draftEntity.ogImage = draft.og_image;
    }
    return computeQualityScore(draftEntity, entityType, entities, focusKeyword);
  }, [selected, draft, entityType, entities]);

  // ── Score delta from history ───────────────────────────────────────────────
  const scoreDelta = useMemo(() => {
    if (!selected || !quality) return null;
    const lastScore = getLastScore(selected.id);
    if (lastScore === null) return null;
    return quality.score - lastScore;
  }, [selected, quality]);

  // ── Schema.org checks ─────────────────────────────────────────────────────
  const schemaCheck = useMemo(() => {
    if (!selected) return null;
    return checkSchemaOrg(selected, entityType, draft);
  }, [selected, entityType, draft]);

  // ── Readability score for current entity ────────────────────────────────────
  const readability = useMemo(() => {
    if (!selected) return null;
    const desc = entityType === 'article' ? draft.meta_description : draft.seo_description;
    return computeFleschKincaid(desc || '');
  }, [selected, draft, entityType]);

  // ── Focus keyword checks ──────────────────────────────────────────────────
  const focusChecks = useMemo(() => {
    if (!selected || !focusKeyword) return [];
    const desc = entityType === 'article' ? draft.meta_description : draft.seo_description;
    return computeFocusKeywordChecks(focusKeyword, draft.seo_title, desc, selected.slug, selected);
  }, [selected, focusKeyword, draft, entityType]);

  // ── Page Audit (Feature 1) ────────────────────────────────────────────────
  const pageAudit = useMemo(() => {
    if (!selected) return null;
    return computePageAudit(selected, entityType);
  }, [selected, entityType]);

  // ── Cannibalisation Detection (Feature 2) ─────────────────────────────────
  const cannibalisation = useMemo(() => {
    if (!selected) return { conflicts: [] };
    return detectCannibalisation(selected, entityType, allEntitiesMap);
  }, [selected, entityType, allEntitiesMap]);

  // ── Internal Linking (Feature 3) ──────────────────────────────────────────
  const internalLinks = useMemo(() => {
    if (!selected) return { suggestions: [] };
    return suggestInternalLinks(selected, entityType, allEntitiesMap);
  }, [selected, entityType, allEntitiesMap]);

  // ── CTR Analysis (Feature 4) ──────────────────────────────────────────────
  const ctrAnalysis = useMemo(() => {
    if (!selected) return null;
    return analyseCTR(draft.seo_title || '', entityType, selected.name || selected.title || '');
  }, [selected, draft.seo_title, entityType]);

  const getName = (e) => e.name || e.title || 'Untitled';
  const getUrl = (e) => {
    if (entityType === 'listing') return `luxuryweddingdirectory.com/venue/${e.slug || '...'}`;
    if (entityType === 'showcase') return `luxuryweddingdirectory.com/showcase/${e.slug || '...'}`;
    return `luxuryweddingdirectory.com/magazine/${e.slug || '...'}`;
  };
  const getDescField = () => entityType === 'article' ? 'meta_description' : 'seo_description';

  // ── Cross-link handler ─────────────────────────────────────────────────────
  const openInStudio = () => {
    if (!selected) return;
    if (entityType === 'listing') {
      window.location.hash = `listing-studio/${selected.id}`;
    } else if (entityType === 'showcase') {
      window.location.hash = `showcase-studio/${selected.id}`;
    } else {
      window.location.hash = `magazine-studio`;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Render ─────────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', fontFamily: NU, background: DK ? '#141414' : '#fafaf8', flexDirection: isMobile ? 'column' : 'row' }}>

      {/* ── Left Rail (hidden on mobile, replaced with dropdown) ── */}
      {!isMobile && (
        <div style={{ width: railWidth, minWidth: railWidth, borderRight: `1px solid ${DK ? '#333' : '#e5e7eb'}`, display: 'flex', flexDirection: 'column', background: DK ? '#1e1e1e' : '#fff' }}>
          <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${DK ? '#333' : '#f3f4f6'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: DK ? '#f0f0f0' : '#1a1a1a', fontFamily: GD }}>AI SEO Studio</span>
            </div>

            {/* Entity tabs */}
            <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: `1px solid ${DK ? '#444' : '#e5e7eb'}` }}>
              {ENTITY_TYPES.map(t => (
                <button key={t.key} onClick={() => switchEntityType(t.key)} style={{
                  flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600, fontFamily: NU,
                  border: 'none', cursor: 'pointer',
                  background: entityType === t.key ? '#1a1a1a' : (DK ? '#252525' : '#fff'),
                  color: entityType === t.key ? '#fff' : (DK ? '#9ca3af' : '#6b7280'),
                  transition: 'all 0.15s',
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 11, color: DK ? '#9ca3af' : '#6b7280', alignItems: 'center', flexWrap: 'wrap' }}>
              <span><strong style={{ color: DK ? '#f0f0f0' : '#1a1a1a' }}>{stats.total}</strong> total</span>
              <span style={{ color: DK ? '#555' : '#d1d5db' }}>{'·'}</span>
              <span><strong style={{ color: '#10b981' }}>{stats.strong}</strong> strong</span>
              <span style={{ color: DK ? '#555' : '#d1d5db' }}>{'·'}</span>
              <span><strong style={{ color: stats.weak > 0 ? '#f59e0b' : '#10b981' }}>{stats.weak}</strong> needs work</span>
              <span style={{ color: DK ? '#555' : '#d1d5db' }}>{'·'}</span>
              <span style={{ fontWeight: 600, color: stats.avg >= 75 ? '#10b981' : stats.avg >= 50 ? '#f59e0b' : '#ef4444' }}>Avg {stats.avg}</span>
            </div>

            {/* Search + Export */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, borderRadius: 4, fontFamily: NU, boxSizing: 'border-box', background: DK ? '#252525' : '#fafaf8', color: DK ? '#f0f0f0' : '#1a1a1a' }} />
              <button onClick={() => exportEntitiesCsv(filteredEntities, entityType)} title="Export filtered entities as CSV" style={{
                padding: '7px 10px', fontSize: 11, fontWeight: 600, fontFamily: NU,
                border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, borderRadius: 4, cursor: 'pointer',
                background: DK ? '#252525' : '#fff', color: DK ? '#d1d5db' : '#374151', whiteSpace: 'nowrap',
              }}>{'↓'} CSV</button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[['all', 'All'], ['incomplete', 'Needs Work'], ['complete', 'Strong']].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} style={{
                  padding: '4px 10px', fontSize: 10, fontWeight: 600, borderRadius: 12,
                  border: `1px solid ${filter === k ? G : (DK ? '#444' : '#e5e7eb')}`,
                  background: filter === k ? (DK ? '#3a3018' : '#fef3c7') : (DK ? '#252525' : '#fff'),
                  color: filter === k ? (DK ? '#d4a850' : '#92400e') : (DK ? '#9ca3af' : '#6b7280'), cursor: 'pointer', fontFamily: NU,
                }}>{l}</button>
              ))}
            </div>

            {/* Bulk actions */}
            {(
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.bulkTargets > 0 && (
                  <button onClick={handleBulk} disabled={bulkRunning} style={{
                    width: '100%', padding: '8px 0', fontSize: 11, fontWeight: 700, fontFamily: NU,
                    background: bulkRunning ? (DK ? '#333' : '#f3f4f6') : G, color: bulkRunning ? '#9ca3af' : '#fff',
                    border: 'none', borderRadius: 4, cursor: bulkRunning ? 'wait' : 'pointer', letterSpacing: '0.04em',
                  }}>
                    {bulkRunning ? `Generating ${bulkProgress.current}/${bulkProgress.total}...` : `${'✦'} Fill Empty (${stats.bulkTargets} missing)`}
                  </button>
                )}
                {stats.weak > 0 && (
                  <button onClick={handleBulkImprove} disabled={bulkRunning} style={{
                    width: '100%', padding: '8px 0', fontSize: 11, fontWeight: 700, fontFamily: NU,
                    background: bulkRunning ? (DK ? '#333' : '#f3f4f6') : 'transparent',
                    color: bulkRunning ? '#9ca3af' : G,
                    border: `1px solid ${bulkRunning ? (DK ? '#333' : '#e5e7eb') : G}`,
                    borderRadius: 4, cursor: bulkRunning ? 'wait' : 'pointer', letterSpacing: '0.04em',
                  }}>
                    {bulkRunning ? `Improving ${bulkProgress.current}/${bulkProgress.total}...` : `${'↑'} Improve Weak (${stats.weak} below 90)`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Entity list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Loading...</div>
            ) : filteredEntities.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No results</div>
            ) : (
              filteredEntities.map(e => {
                const q = entityScoresMap.get(e.id) || computeQualityScore(e, entityType, entities);
                const isActive = selected?.id === e.id;
                return (
                  <button key={e.id} onClick={() => selectEntity(e)} style={{
                    width: '100%', textAlign: 'left', padding: '10px 16px',
                    background: isActive ? (DK ? '#2a2518' : '#fef9ee') : 'transparent',
                    borderTop: 'none', borderRight: 'none',
                    borderBottom: `1px solid ${DK ? '#2a2a2a' : '#f3f4f6'}`,
                    borderLeft: isActive ? `3px solid ${G}` : '3px solid transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'background 0.1s',
                  }}>
                    <ScoreRing pct={q.score} size={32} DK={DK} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: DK ? '#f0f0f0' : '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getName(e)}
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700, color: gradeColor(q.grade) }}>{q.grade}</span>
                        <span>{'·'}</span>
                        <span>{q.issues.length === 0 ? 'No issues' : `${q.issues.length} issue${q.issues.length > 1 ? 's' : ''}`}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Centre Panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 60px' : '24px 32px 60px' }}>

        {/* Mobile entity selector */}
        {isMobile && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {ENTITY_TYPES.map(t => (
                <button key={t.key} onClick={() => switchEntityType(t.key)} style={{
                  padding: '6px 12px', fontSize: 11, fontWeight: 600, fontFamily: NU,
                  border: 'none', cursor: 'pointer', borderRadius: 6,
                  background: entityType === t.key ? '#1a1a1a' : (DK ? '#333' : '#e5e7eb'),
                  color: entityType === t.key ? '#fff' : (DK ? '#9ca3af' : '#6b7280'),
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
              <button onClick={() => exportEntitiesCsv(filteredEntities, entityType)} style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 600, fontFamily: NU,
                border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, borderRadius: 6, cursor: 'pointer',
                background: DK ? '#252525' : '#fff', color: DK ? '#d1d5db' : '#374151',
              }}>{'↓'} CSV</button>
            </div>
            <select
              value={selected?.id || ''}
              onChange={e => {
                const ent = filteredEntities.find(x => x.id === e.target.value);
                if (ent) selectEntity(ent);
              }}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: NU,
                border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, borderRadius: 6,
                background: DK ? '#252525' : '#fff', color: DK ? '#f0f0f0' : '#1a1a1a',
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select {entityType}...</option>
              {filteredEntities.map(e => {
                const q = entityScoresMap.get(e.id) || { grade: '?', score: 0 };
                return <option key={e.id} value={e.id}>{getName(e)} ({q.grade} {q.score})</option>;
              })}
            </select>
          </div>
        )}

        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: isMobile ? 'auto' : '100%', color: '#9ca3af', padding: isMobile ? '40px 0' : 0 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{'⊞'}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: DK ? '#9ca3af' : '#6b7280' }}>
              Select {entityType === 'article' ? 'an' : 'a'} {entityType} to optimise
            </div>
            <div style={{ fontSize: 12, marginTop: 4, maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
              Each entity gets a quality score (0-100) based on title length, description quality, keyword coverage, and uniqueness. Use AI to generate or improve SEO fields.
            </div>
          </div>
        ) : (
          <>
            {/* Header with nav */}
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${DK ? '#2a2a2a' : '#f3f4f6'}`, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Prev/Next */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={navigatePrev} disabled={selectedIdx <= 0} title="Previous"
                    style={{ width: 28, height: 28, borderRadius: 4, border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, background: DK ? '#252525' : '#fff', cursor: selectedIdx > 0 ? 'pointer' : 'default', opacity: selectedIdx > 0 ? 1 : 0.3, fontSize: 12, color: DK ? '#f0f0f0' : '#1a1a1a' }}>
                    {'←'}
                  </button>
                  <button onClick={navigateNext} disabled={selectedIdx >= filteredEntities.length - 1} title="Next"
                    style={{ width: 28, height: 28, borderRadius: 4, border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, background: DK ? '#252525' : '#fff', cursor: selectedIdx < filteredEntities.length - 1 ? 'pointer' : 'default', opacity: selectedIdx < filteredEntities.length - 1 ? 1 : 0.3, fontSize: 12, color: DK ? '#f0f0f0' : '#1a1a1a' }}>
                    {'→'}
                  </button>
                </div>
                <div>
                  <h2 style={{ fontFamily: GD, fontSize: isMobile ? 17 : 20, fontWeight: 400, color: DK ? '#f0f0f0' : '#1a1a1a', margin: 0 }}>
                    {getName(selected)}
                  </h2>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Editable slug */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
                      <span style={{ color: '#9ca3af' }}>
                        {entityType === 'listing' ? 'luxuryweddingdirectory.com/venue/' :
                         entityType === 'showcase' ? 'luxuryweddingdirectory.com/showcase/' :
                         'luxuryweddingdirectory.com/magazine/'}
                      </span>
                      {editingSlug !== null ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="text"
                            value={editingSlug}
                            onChange={e => setEditingSlug(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveSlug(); if (e.key === 'Escape') setEditingSlug(null); }}
                            style={{
                              fontSize: 11, padding: '1px 4px', border: `1px solid ${G}`, borderRadius: 3,
                              fontFamily: NU, color: DK ? '#f0f0f0' : '#1a1a1a', background: DK ? '#2a2518' : '#fef9ee', width: Math.max(80, editingSlug.length * 6.5),
                              outline: 'none', boxSizing: 'border-box',
                            }}
                            autoFocus
                          />
                          <button onClick={handleSaveSlug} disabled={savingSlug} style={{
                            fontSize: 9, padding: '1px 5px', borderRadius: 3,
                            background: G, color: '#fff', border: 'none',
                            cursor: savingSlug ? 'wait' : 'pointer', fontFamily: NU, fontWeight: 700,
                          }}>{savingSlug ? '...' : 'Save'}</button>
                          <button onClick={() => setEditingSlug(null)} style={{
                            fontSize: 9, padding: '1px 5px', borderRadius: 3,
                            background: 'none', color: '#9ca3af', border: `1px solid ${DK ? '#555' : '#d1d5db'}`,
                            cursor: 'pointer', fontFamily: NU,
                          }}>Cancel</button>
                        </span>
                      ) : (
                        <span
                          onClick={() => setEditingSlug(selected.slug || '')}
                          title="Click to edit slug"
                          style={{ color: DK ? '#9ca3af' : '#6b7280', cursor: 'pointer', borderBottom: `1px dashed ${DK ? '#555' : '#d1d5db'}` }}
                        >
                          {selected.slug || '...'}
                        </span>
                      )}
                    </span>
                    <button onClick={openInStudio} style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 3,
                      background: 'none', border: `1px solid ${DK ? '#555' : '#d1d5db'}`, color: DK ? '#9ca3af' : '#6b7280',
                      cursor: 'pointer', fontFamily: NU,
                    }}>
                      Open in {entityType === 'listing' ? 'Listing' : entityType === 'showcase' ? 'Showcase' : 'Magazine'} Studio {'↗'}
                    </button>
                    <span style={{ fontSize: 10, color: DK ? '#555' : '#d1d5db' }}>
                      {selectedIdx + 1} of {filteredEntities.length}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {quality && <ScoreRing pct={quality.score} size={44} label={quality.grade} DK={DK} />}
                {!isMobile && (
                  <button onClick={runCompetitorAnalysis} disabled={competitorLoading || !!generatingField} style={{
                    padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: NU, borderRadius: 4,
                    border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, background: competitorLoading ? (DK ? '#333' : '#f3f4f6') : (DK ? '#252525' : '#fff'),
                    color: competitorLoading ? '#9ca3af' : (DK ? '#d1d5db' : '#374151'), cursor: competitorLoading ? 'wait' : 'pointer',
                    letterSpacing: '0.03em',
                  }}>
                    {competitorLoading ? 'Analysing...' : '\u2295 Compare'}
                  </button>
                )}
                <button onClick={generateAll} disabled={!!generatingField} style={{
                  padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: NU, borderRadius: 4,
                  border: 'none', background: generatingField === 'all' ? (DK ? '#333' : '#f3f4f6') : '#1a1a1a',
                  color: generatingField === 'all' ? '#9ca3af' : '#fff', cursor: generatingField ? 'wait' : 'pointer',
                  letterSpacing: '0.03em',
                }}>
                  {generatingField === 'all' ? 'Generating...' : '\u2726 AI Generate All'}
                </button>
                <button onClick={handleSave} disabled={!dirty || saving} style={{
                  padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: NU, borderRadius: 4,
                  border: dirty ? 'none' : `1px solid ${DK ? '#444' : '#e5e7eb'}`,
                  background: dirty ? G : (DK ? '#252525' : '#fff'), color: dirty ? '#fff' : '#9ca3af',
                  cursor: dirty ? 'pointer' : 'default', letterSpacing: '0.03em',
                  animation: savePulse ? 'seoPulse 0.6s ease-in-out infinite' : 'none',
                  boxShadow: savePulse ? `0 0 12px ${G}40` : 'none',
                  transition: 'box-shadow 0.3s',
                }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Priority Actions — "what to do next, in what order" */}
            <PriorityActionsPanel
              quality={quality}
              ctrAnalysis={ctrAnalysis}
              pageAudit={pageAudit}
              cannibalisation={cannibalisation}
              onAction={handleQuickFix}
              onFixAll={handleFixAll}
              fixingAction={fixingAction}
              recentlyFixed={recentlyFixed}
              generating={generating}
              fixAllRunning={fixAllRunning}
              DK={DK}
            />

            {/* Outrank Mode */}
            <OutrankPanel
              entity={selected}
              entityType={entityType}
              draft={draft}
              DK={DK}
              updateDraft={updateDraft}
              notify={notify}
              onApply={(result) => {
                if (result.title) updateDraft('seo_title', result.title);
                const descField = entityType === 'article' ? 'meta_description' : 'seo_description';
                if (result.description) updateDraft(descField, result.description);
                if (entityType === 'listing' && result.keywords) updateDraft('seo_keywords', result.keywords);
                notify('Outrank package applied — save to persist');
                setSavePulse(true);
                setTimeout(() => setSavePulse(false), 3000);
              }}
            />

            {/* ── Section divider ── */}
            <div style={{ height: 1, background: DK ? '#2a2a2a' : '#f3f4f6', margin: '4px 0 20px' }} />

            {/* AI Recommendations + Readability + Focus Keyword checks */}
            <RecommendationsPanel quality={quality} DK={DK} scoreDelta={scoreDelta} />

            {/* CTR Optimisation (Feature 4) — shown after SEO Health */}
            {ctrAnalysis && ctrAnalysis.ctrScore > 0 && (
              <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
                <CTRPanel analysis={ctrAnalysis} DK={DK} />
              </div>
            )}

            {/* ── Section divider ── */}
            <div style={{ height: 1, background: DK ? '#2a2a2a' : '#f3f4f6', margin: '4px 0 20px' }} />

            {/* Page Content Audit (Feature 1) */}
            <PageAuditPanel audit={pageAudit} DK={DK} />

            {/* Cannibalisation Detection (Feature 2) */}
            <CannibalisationPanel conflicts={cannibalisation.conflicts} DK={DK} onResolve={handleCannibalResolve} loading={crossTypeLoading} fixingAction={fixingAction} primaryPages={primaryPages} />

            {/* Internal Linking Recommendations (Feature 3) */}
            <InternalLinksPanel suggestions={internalLinks.suggestions} DK={DK} onInsertLink={handleInsertLink} loading={crossTypeLoading} fixingAction={fixingAction} />

            {/* Readability + Focus Keyword + Schema.org advisory items */}
            {(readability || focusChecks.length > 0 || schemaCheck) && (
              <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G, marginBottom: 10 }}>
                  Additional Checks
                </div>
                {readability && readability.label !== 'N/A' && (
                  <div style={{
                    fontSize: 11, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 4,
                    color: (readability.grade >= 6 && readability.grade <= 8) ? '#059669' : (DK ? '#9ca3af' : '#6b7280'),
                  }}>
                    {(readability.grade >= 6 && readability.grade <= 8) ? '\u2705' : '\uD83D\uDD35'}{' '}
                    Description readability: {readability.label}
                    {(readability.grade >= 6 && readability.grade <= 8)
                      ? ' (optimal)'
                      : readability.grade > 8
                        ? ' -- simplify language for broader appeal'
                        : ' -- could add more detail'}
                  </div>
                )}
                {focusChecks.map((check, i) => (
                  <div key={i} style={{
                    fontSize: 11, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 4,
                    color: check.pass ? '#059669' : (DK ? '#9ca3af' : '#6b7280'),
                  }}>
                    {check.pass ? '\u2705' : '\uD83D\uDD35'} {check.msg}
                  </div>
                ))}

                {/* Schema.org hints */}
                {schemaCheck && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${DK ? '#333' : '#f3f4f6'}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151', marginBottom: 4 }}>
                      Schema.org ({schemaCheck.schemaType})
                    </div>
                    <div style={{
                      fontSize: 11, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 4,
                      color: schemaCheck.pass ? '#059669' : (DK ? '#9ca3af' : '#6b7280'),
                    }}>
                      {schemaCheck.pass ? '\u2705' : '\uD83D\uDFE1'} {schemaCheck.pass ? `Sufficient data for ${schemaCheck.schemaType} schema` : `Missing data for ${schemaCheck.schemaType} schema`}
                    </div>
                    {!schemaCheck.pass && (
                      <div style={{ marginLeft: 18 }}>
                        {schemaCheck.checks.filter(c => !c.pass).map((c, i) => (
                          <div key={i} style={{ fontSize: 10, color: DK ? '#9ca3af' : '#6b7280', padding: '1px 0' }}>
                            {'•'} Missing: {c.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Competitor Insights */}
            <CompetitorInsightsPanel
              analysis={competitorAnalysis}
              loading={competitorLoading}
              collapsed={competitorCollapsed}
              onToggle={() => setCompetitorCollapsed(prev => !prev)}
              DK={DK}
            />

            {/* Two-column: Previews + Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: isTablet ? 14 : 20 }}>
              {/* Previews */}
              <div>
                <SerpPreview title={draft.seo_title} description={draft[getDescField()]} url={getUrl(selected)} DK={DK} />
                <SocialPreview title={draft.seo_title} description={draft[getDescField()]}
                  image={draft.og_image || selected.hero_image_url || selected.hero_image || selected.heroImage}
                  url={getUrl(selected)} DK={DK} />
              </div>

              {/* Fields */}
              <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G }}>
                    SEO Fields
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setUseComparisonMode(prev => !prev)} style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 3, fontFamily: NU,
                      background: useComparisonMode ? (DK ? '#2a2518' : '#fef3c7') : (DK ? '#252525' : '#f9fafb'),
                      color: useComparisonMode ? (DK ? '#d4a850' : '#92400e') : (DK ? '#777' : '#9ca3af'),
                      border: `1px solid ${useComparisonMode ? (DK ? '#5a4a1a' : '#fde68a') : (DK ? '#444' : '#e5e7eb')}`,
                      cursor: 'pointer',
                    }}>
                      {useComparisonMode ? 'Compare ON' : 'Compare OFF'}
                    </button>
                    {JSON.stringify(draft) !== JSON.stringify(preDraft) && (
                      <button onClick={undoAll} style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 3,
                        background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5',
                        cursor: 'pointer', fontFamily: NU,
                      }}>{'↩'} Undo All Changes</button>
                    )}
                  </div>
                </div>

                {/* Focus Keyword */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151' }}>
                      Focus Keyword
                    </label>
                    {focusKeyword && (
                      <span style={{ fontSize: 10, color: focusChecks.every(c => c.pass) ? '#10b981' : '#9ca3af' }}>
                        {focusChecks.filter(c => c.pass).length}/{focusChecks.length} checks pass
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={e => setFocusKeyword(e.target.value)}
                    placeholder={entityType === 'listing' && (draft.seo_keywords || []).length > 0
                      ? `e.g. ${draft.seo_keywords[0]}`
                      : 'e.g. luxury wedding venue italy'}
                    style={{
                      width: '100%', padding: '9px 12px', fontSize: 13,
                      border: `1px solid ${DK ? '#555' : '#d1d5db'}`, borderRadius: 4, fontFamily: NU,
                      color: DK ? '#f0f0f0' : '#1f2937', boxSizing: 'border-box', background: DK ? '#252525' : '#fff',
                    }}
                  />
                  {entityType === 'listing' && (draft.seo_keywords || []).length > 0 && !focusKeyword && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(draft.seo_keywords || []).slice(0, 4).map((kw, i) => (
                        <button key={i} onClick={() => setFocusKeyword(kw)} style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 10,
                          background: DK ? '#252525' : '#f9fafb', border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, color: DK ? '#9ca3af' : '#6b7280',
                          cursor: 'pointer', fontFamily: NU,
                        }}>{kw}</button>
                      ))}
                    </div>
                  )}
                </div>

                <FieldRow label="SEO Title" value={draft.seo_title} onChange={v => updateDraft('seo_title', v)}
                  maxLen={60} minLen={50} placeholder="Compelling page title for search results..."
                  generating={generatingField === 'title'} onGenerate={() => generateField('title')}
                  undoValue={preDraft.seo_title} onUndo={() => undoField('seo_title')} DK={DK} />
                {aiComparisons && aiComparisons.field === 'seo_title' && (
                  <ComparisonPicker field="SEO Title" current={aiComparisons.current} options={aiComparisons.options}
                    onPick={(v) => { updateDraft('seo_title', v); setAiComparisons(null); }}
                    onCancel={() => setAiComparisons(null)} DK={DK} />
                )}

                <FieldRow label={entityType === 'article' ? 'Meta Description' : 'SEO Description'}
                  value={draft[getDescField()]} onChange={v => updateDraft(getDescField(), v)}
                  maxLen={160} minLen={140} placeholder="Persuasive description that drives clicks..."
                  generating={generatingField === 'desc'} onGenerate={() => generateField('desc')} multiline
                  undoValue={preDraft[getDescField()]} onUndo={() => undoField(getDescField())} DK={DK} />
                {aiComparisons && aiComparisons.field === getDescField() && (
                  <ComparisonPicker field={entityType === 'article' ? 'Meta Description' : 'SEO Description'}
                    current={aiComparisons.current} options={aiComparisons.options}
                    onPick={(v) => { updateDraft(getDescField(), v); setAiComparisons(null); }}
                    onCancel={() => setAiComparisons(null)} DK={DK} />
                )}

                {entityType === 'listing' && (
                  <KeywordsEditor value={draft.seo_keywords || []}
                    onChange={v => updateDraft('seo_keywords', v)}
                    generating={generatingField === 'keywords'} onGenerate={() => generateField('keywords')}
                    undoValue={preDraft.seo_keywords} onUndo={() => undoField('seo_keywords')} DK={DK} />
                )}

                {(entityType === 'showcase' || entityType === 'article') && (
                  <OgImageField value={draft.og_image}
                    onChange={v => updateDraft('og_image', v)}
                    entityType={entityType}
                    entitySlug={selected?.slug} DK={DK} />
                )}

                {/* Canonical URL (showcases and articles only) */}
                {(entityType === 'showcase' || entityType === 'article') && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151' }}>
                        Canonical URL
                      </label>
                    </div>
                    <input
                      type="text"
                      value={draft.canonical_url || ''}
                      onChange={e => updateDraft('canonical_url', e.target.value)}
                      placeholder="https://... (leave blank for self-referencing)"
                      style={{
                        width: '100%', padding: '9px 12px', fontSize: 13,
                        border: `1px solid ${DK ? '#555' : '#d1d5db'}`, borderRadius: 4, fontFamily: NU,
                        color: DK ? '#f0f0f0' : '#1f2937', boxSizing: 'border-box', background: DK ? '#252525' : '#fff',
                      }}
                    />
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                      Set if this content also exists at another URL. Leave empty for default self-referencing canonical.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 8, color: DK ? '#555' : '#d1d5db', fontFamily: NU, letterSpacing: '0.02em' }}>
              {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl+'}S save {'·'} Alt+{'←'} prev {'·'} Alt+{'→'} next {'·'} Esc close
            </div>
          </>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

// ── Wrapped export with Error Boundary ──────────────────────────────────────

export default function WrappedAiSeoStudioModule(props) {
  return (
    <SeoStudioErrorBoundary>
      <AiSeoStudioModule {...props} />
    </SeoStudioErrorBoundary>
  );
}
