// ═══════════════════════════════════════════════════════════════════════════════
// useHomepageContent Hook
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import * as homepageService from "../services/homepageService";

/**
 * Hook to manage homepage content for editor
 * Fetches draft, allows editing, saving, publishing
 */
export function useHomepageContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedStatus, setPublishedStatus] = useState(null);

  // Load draft content on mount
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const draft = await homepageService.getDraftContent();
      const published = await homepageService.getPublishedContent();

      // Use draft if available, else published
      const data = draft || published;

      if (data) {
        setContent(data);
        setPublishedStatus(data.status);
      } else {
        // Initialize with empty form (will use defaults in component)
        setContent({
          hero_title: "",
          hero_subtitle: "",
          hero_cta_text: "",
          hero_cta_link: "",
          hero_image_url: "",
          destination_heading: "",
          destination_subtitle: "",
          destination_ids: [],
          venues_heading: "",
          venues_subtitle: "",
          venues_ids: [],
          signature_heading: "",
          signature_subtitle: "",
          signature_venue_ids: [],
          vendor_heading: "",
          vendor_subtitle: "",
          vendor_ids: [],
          newsletter_heading: "",
          newsletter_subtitle: "",
          newsletter_button_text: "",
        });
      }
    } catch (err) {
      console.error("Load content error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveDraft = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const saved = await homepageService.saveDraft(content);

      setContent(saved);
      setPublishedStatus("draft");
      return saved;
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async () => {
    try {
      setIsPublishing(true);
      setError(null);

      // Save as draft first if not saved
      if (!content.id) {
        await saveDraft();
      }

      const published = await homepageService.publishHomepage();

      setContent(published);
      setPublishedStatus("published");
      return published;
    } catch (err) {
      console.error("Publish error:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsPublishing(false);
    }
  };

  const getPreview = async () => {
    try {
      return await homepageService.getPreviewContent();
    } catch (err) {
      console.error("Preview error:", err);
      throw err;
    }
  };

  return {
    content,
    loading,
    error,
    isSaving,
    isPublishing,
    publishedStatus,
    updateField,
    saveDraft,
    publish,
    getPreview,
    reload: loadContent,
  };
}

/**
 * Hook to fetch published content for HomePage
 * Auto-falls back to defaults
 */
export function usePublishedHomepageContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const published = await homepageService.getPublishedContent();
        const merged = homepageService.mergeWithDefaults(published);
        setContent(merged);
      } catch (err) {
        console.warn("Failed to load homepage content, using defaults:", err);
        setContent(homepageService.mergeWithDefaults(null));
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    // Subscribe to real-time changes
    const unsubscribe = homepageService.subscribeToHomepageChanges(
      (payload) => {
        if (payload.eventType === "UPDATE" && payload.new?.status === "published") {
          const merged = homepageService.mergeWithDefaults(payload.new);
          setContent(merged);
        }
      }
    );

    return () => unsubscribe?.();
  }, []);

  return { content, loading };
}
