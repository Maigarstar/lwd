/**
 * Media mappers for transforming raw mediaItems into card-ready formats
 * Used in listings.ts to build imgs[] and videoUrl from media_items database field
 */

// Relative paths stored in the DB (e.g. "Six-Senses-Krabey-Island/hero.jpg")
// must be served from the Vite public/ root, so they need a leading "/".
function normaliseUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) return url
  return '/' + url
}

/**
 * Transform mediaItems into structured image objects for card rendering
 * Filters for public images, sorts by featured/sort_order, returns {id, src, alt} objects
 */
export function buildCardImgs(mediaItems: any[] = []): any[] {
  return (mediaItems || [])
    .filter(i =>
      (i.type === 'image' || !i.type) &&
      (i.visibility || 'public') === 'public' &&
      !(i.file instanceof File) &&
      (i.url || i.src)
    )
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return (a.sort_order ?? 999) - (b.sort_order ?? 999)
    })
    .map(i => ({
      id: i.id || i.url,
      src: normaliseUrl(i.url || i.src),
      alt: i.alt_text || i.title || ''
    }))
}

/**
 * Extract primary video URL from mediaItems
 * Returns the URL of the first public video item, or null if none found
 */
export function buildCardVideoUrl(mediaItems: any[] = []): string | null {
  const videoItem = (mediaItems || []).find(i =>
    i.type === 'video' &&
    (i.visibility || 'public') === 'public' &&
    (i.url || i.src)
  )
  return videoItem ? (videoItem.url || videoItem.src) : null
}
