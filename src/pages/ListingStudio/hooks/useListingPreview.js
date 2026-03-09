import { useState, useEffect } from 'react';

/**
 * Debounces formData changes with 200ms delay
 * Prevents excessive preview re-renders while typing
 */
const useListingPreview = (formData) => {
  const [previewData, setPreviewData] = useState(formData);

  useEffect(() => {
    // Set a timer to update preview after 200ms of inactivity
    const timer = setTimeout(() => {
      setPreviewData(formData);
    }, 200);

    // Clear timer if formData changes again before 200ms completes
    return () => clearTimeout(timer);
  }, [formData]);

  return previewData;
};

export default useListingPreview;
