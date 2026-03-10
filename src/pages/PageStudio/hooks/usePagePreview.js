import { useState, useEffect } from 'react';

/**
 * usePagePreview — Debounce preview updates (200ms)
 *
 * Prevents excessive re-renders when editing text fields.
 * Returns debounced formData for preview component.
 */

export default function usePagePreview(formData, delay = 200) {
  const [previewData, setPreviewData] = useState(formData);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewData(formData);
    }, delay);

    return () => clearTimeout(timer);
  }, [formData, delay]);

  return previewData;
}
