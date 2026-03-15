import { useState, useCallback } from 'react';
import { updatePage, getPageById } from '../services/pageService';

/**
 * usePageForm, Form state management for page editor
 *
 * Mirrors useListingForm pattern:
 * - Single formData object (source of truth)
 * - hasChanges tracking for unsaved state
 * - save/draft/publish workflow
 * - API integration with pageService
 */

export default function usePageForm(initialPageId) {
  // Initialize formData from mockPages default (homepage)
  // Phase 1: Sections have order property for reordering
  // Phase 2: Sections have customFields array for extensibility
  const getDefaultFormData = () => ({
    id: initialPageId || 'page_home',
    title: 'Homepage',
    slug: '/',
    excerpt: '',
    pageType: 'homepage',
    status: 'draft',
    sections: [
      {
        id: 'hero',
        type: 'slim_hero',
        enabled: true,
        order: 0,
        heading: '',
        subheading: '',
        ctaText: '',
        ctaUrl: '',
        bgImage: '',
        customFields: [],
      },
      { id: 'destinations', type: 'destination_grid', enabled: true, order: 1, heading: '', customFields: [] },
      { id: 'venues', type: 'venue_grid', enabled: true, order: 2, heading: '', venueIds: [], customFields: [] },
      { id: 'featured', type: 'featured_slider', enabled: true, order: 3, heading: '', venueIds: [], customFields: [] },
      { id: 'categories', type: 'category_slider', enabled: true, order: 4, heading: '', customFields: [] },
      { id: 'vendors', type: 'vendor_preview', enabled: true, order: 5, heading: '', vendorIds: [], customFields: [] },
      { id: 'newsletter', type: 'newsletter_band', enabled: true, order: 6, heading: '', ctaText: '', ctaUrl: '', customFields: [] },
      { id: 'directory', type: 'directory_brands', enabled: true, order: 7, heading: '', customFields: [] },
    ],
    seo: { title: '', metaDescription: '', keywords: [] },
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  });

  const [formData, setFormData] = useState(getDefaultFormData());
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'publishing' | 'published' | 'error'
  const [isLoading, setIsLoading] = useState(false);

  // Load page data from Supabase (called on mount if editing existing page)
  const loadPage = useCallback(async (pageId) => {
    if (!pageId || pageId === 'new') {
      setFormData(getDefaultFormData());
      return;
    }

    setIsLoading(true);
    try {
      const page = await getPageById(pageId);
      if (page) {
        setFormData(page);
      } else {
        // No page found, use defaults
        setFormData(getDefaultFormData());
      }
      setHasChanges(false);
    } catch (err) {
      console.error('Error loading page:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a field in formData
  const onChange = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value, updatedAt: new Date().toISOString() }));
    setHasChanges(true);
  }, []);

  // Update a section in formData.sections array
  const onSectionChange = useCallback((sectionId, fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, [fieldName]: value } : s
      ),
      updatedAt: new Date().toISOString(),
    }));
    setHasChanges(true);
  }, []);

  // Save as draft (status: 'draft')
  const handleSaveDraft = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const pageToSave = { ...formData, status: 'draft', publishedAt: null };
      await updatePage(formData.id, pageToSave);
      setFormData(pageToSave);
      setHasChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Error saving draft:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        stack: err?.stack,
      });
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [formData]);

  // Publish (status: 'published')
  const handlePublish = useCallback(async () => {
    setSaveStatus('publishing');
    try {
      const pageToPublish = { ...formData, status: 'published', publishedAt: new Date().toISOString() };
      await updatePage(formData.id, pageToPublish);
      setFormData(pageToPublish);
      setHasChanges(false);
      setSaveStatus('published');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Error publishing:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        stack: err?.stack,
      });
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [formData]);

  // Discard changes
  const handleDiscard = useCallback(async () => {
    if (hasChanges) {
      const confirmed = window.confirm('Discard all changes? This cannot be undone.');
      if (confirmed) {
        // Reload from database or use default
        try {
          const page = await getPageById(formData.id);
          if (page) {
            setFormData(page);
          } else {
            setFormData(getDefaultFormData());
          }
        } catch (err) {
          console.error('Error reloading page:', err);
          setFormData(getDefaultFormData());
        }
        setHasChanges(false);
      }
    }
  }, [hasChanges, formData.id]);

  return {
    formData,
    hasChanges,
    saveStatus,
    isLoading,
    onChange,
    onSectionChange,
    handleSaveDraft,
    handlePublish,
    handleDiscard,
    loadPage,
  };
}
