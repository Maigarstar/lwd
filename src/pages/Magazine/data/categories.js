// The default category every new article falls into if the author doesn't
// pick one. Matches WordPress's "Default Post Category" pattern — Editorial
// is guaranteed to exist so save can silently reapply it when needed.
export const DEFAULT_CATEGORY_ID    = 'editorial';
export const DEFAULT_CATEGORY_LABEL = 'Editorial';

export const CATEGORIES = [
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Longform features, opinion, and the editorial voice of Luxury Wedding Directory.',
    heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#c9a96e',
    defaultCardStyle: 'editorial',
  },
  {
    id: 'destinations',
    label: 'Destinations',
    description: 'The world\'s most extraordinary wedding locations, from Amalfi clifftops to Scottish estates.',
    heroImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#7ba7bc',
    defaultCardStyle: 'overlay',
  },
  {
    id: 'venues',
    label: 'Venues',
    description: 'Palaces, châteaux, villas, and estates. The finest wedding venues on earth.',
    heroImage: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#b8a9c9',
    defaultCardStyle: 'standard',
  },
  {
    id: 'fashion',
    label: 'Fashion & Beauty',
    description: 'Bridal couture, beauty rituals, and the designers shaping the future of the modern wedding.',
    heroImage: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#d4a5a5',
    defaultCardStyle: 'editorial',
  },
  {
    id: 'real-weddings',
    label: 'Real Weddings',
    description: 'Extraordinary love stories told through the world\'s most beautiful wedding photography.',
    heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#c9a96e',
    defaultCardStyle: 'overlay',
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Expert advice, insider guides, and the knowledge to plan an extraordinary celebration.',
    heroImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#a0b4a0',
    defaultCardStyle: 'horizontal',
  },
  {
    id: 'honeymoons',
    label: 'Honeymoons',
    description: 'Private islands, mountain retreats, and city suites. The first chapter of your married life.',
    heroImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#7ba7bc',
    defaultCardStyle: 'overlay',
  },
  {
    id: 'trends',
    label: 'Trends',
    description: 'The ideas, aesthetics, and movements defining how the world\'s most discerning couples celebrate.',
    heroImage: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#c9a96e',
    defaultCardStyle: 'standard',
  },
  {
    id: 'news',
    label: 'News',
    description: 'Industry news, award announcements, and the stories shaping luxury weddings worldwide.',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#a8a8a8',
    defaultCardStyle: 'horizontal',
  },
  {
    id: 'travel',
    label: 'Travel',
    description: 'Private jets, five-star retreats, and the journeys that define a life of extraordinary taste.',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#6ba3be',
    defaultCardStyle: 'overlay',
  },
  {
    id: 'home-living',
    label: 'Home & Living',
    description: 'Interior design, tablescaping, and the art of creating spaces where luxury meets intimacy.',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85',
    accentColor: '#b8a088',
    defaultCardStyle: 'editorial',
  },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || null;
}
