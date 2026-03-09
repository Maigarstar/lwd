import { useState, useEffect, useRef, createContext, useContext } from "react";
import { getDefaultMode } from "./theme/tokens";
import GCardMobile from "./components/cards/GCardMobile";
import SliderNav from "./components/ui/SliderNav";

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = (e) => setMobile(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, [bp]);
  return mobile;
}

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
const LIGHT = {
  bg:         "#ffffff",
  bgAlt:      "#f7f7f5",
  surface:    "#ffffff",
  border:     "#ebebeb",
  border2:    "#d8d8d8",
  gold:       "#9d873e",
  goldLight:  "rgba(157,135,62,0.07)",
  goldBorder: "rgba(157,135,62,0.2)",
  green:      "#748172",
  greenLight: "rgba(116,129,114,0.07)",
  text:       "#1a1a18",
  textMid:    "#4a4844",
  textLight:  "#6b6560",
  textMuted:  "#9c9690",
  navBg:      "rgba(255,255,255,0.96)",
  shadow:     "0 2px 16px rgba(0,0,0,0.05)",
  shadowMd:   "0 8px 40px rgba(0,0,0,0.08)",
  shadowLg:   "0 24px 64px rgba(0,0,0,0.1)",
};
const DARK = {
  bg:         "#0f0f0d",
  bgAlt:      "#141412",
  surface:    "#1a1a18",
  border:     "#2e2e2a",
  border2:    "#3c3c38",
  gold:       "#b8a05a",
  goldLight:  "rgba(184,160,90,0.1)",
  goldBorder: "rgba(184,160,90,0.25)",
  green:      "#8fa08c",
  greenLight: "rgba(143,160,140,0.1)",
  text:       "#f5f2ec",
  textMid:    "#c8c4bc",
  textLight:  "#9c9890",
  textMuted:  "#6b6860",
  navBg:      "rgba(15,15,13,0.94)",
  shadow:     "0 2px 16px rgba(0,0,0,0.4)",
  shadowMd:   "0 8px 40px rgba(0,0,0,0.5)",
  shadowLg:   "0 24px 64px rgba(0,0,0,0.6)",
};
const Theme = createContext(LIGHT);
const useT = () => useContext(Theme);
// Font stacks — resolved via CSS custom properties set by ThemeLoader
const FD = "var(--font-heading-primary)"; // display
const FB = "var(--font-body)";            // body

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const VENUE = {
  id: 1,
  name: "Villa Rosanova",
  tagline: "An eighteenth-century Tuscan estate for weddings of extraordinary distinction",
  location: "San Casciano in Val di Pesa, Tuscany",
  country: "Italy", flag: "🇮🇹",
  rating: 4.9, reviews: 127,
  responseTime: "2 hrs", responseRate: 98,
  established: 1847, weddingsHosted: 312,
  priceFrom: "£12,500",
  capacity: { min: 20, max: 180, ceremony: 200, dinner: 160 },
  verified: true, featured: true,
  accommodation: {
    type: 'Historic Tuscan Villa',
    totalRooms: 18,
    totalSuites: 6,
    maxOvernightGuests: 40,
    exclusiveUse: true,
    minNightStay: 2,
    description: '<p>Villa Rosanova offers 18 beautifully appointed bedrooms and suites across the main villa and three historic cottages. Couples and their guests can enjoy a full wedding weekend experience in exclusive surroundings, with the entire property available for private hire.</p><p>Each room is individually decorated with antique furnishings, Frette linens, and original artworks sourced from local artists.</p>',
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&q=80',
    ],
  },
  dining: {
    style: 'Michelin-inspired Tuscan farm-to-table cuisine',
    chefName: 'Marco Ricci',
    inHouseCatering: true,
    externalCateringAllowed: true,
    menuStyles: ['Plated Dinner', 'Tasting Menu', 'Family Style', 'Buffet'],
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten Free', 'Halal', 'Kosher'],
    drinksOptions: ['Wine Pairing', 'Open Bar', 'Signature Cocktails', 'Non-Alcoholic'],
    description: '<p>Seasonal Italian cuisine, prepared using produce grown in Villa Rosanova\'s kitchen garden and sourced from neighbouring farms, forms the heart of every celebration. Head Chef Marco Ricci crafts bespoke menus that reflect the rhythms of the Tuscan seasons — from truffle risotto in autumn to grilled sea bass with summer herbs.</p><p>Couples choose from elegant plated dinners, relaxed family-style dining, or curated tasting menus paired with regional wines selected by our in-house sommelier.</p>',
    menuImages: [
      { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', title: 'Antipasto Board — Local cheeses, truffle honey, cured meats' },
      { src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', title: 'Primo — Handmade pappardelle with wild boar ragù' },
      { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', title: 'Secondo — Wood-roasted lamb with rosemary and juniper' },
      { src: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', title: 'Dolce — Lemon tart with Amalfi cream and basil sorbet' },
    ],
  },
  venueType: {
    primaryType: 'Historic Villa',
    styles: ['Tuscan', 'Countryside', 'Vineyard', 'Exclusive Use', 'Garden Ceremony'],
    architecture: 'Renaissance',
    built: '1742',
    description: 'Villa Rosanova is a meticulously restored 18th-century Tuscan villa set within 12 hectares of manicured gardens, vineyards, and olive groves in the heart of Chianti.',
    features: ['Outdoor Ceremony', 'Indoor Ceremony', 'Vineyard', 'Chapel', 'Gardens', 'Swimming Pool', 'Helicopter Pad'],
  },
  categories: ["Luxury Villa", "Exclusive Use", "Destination Wedding"],
  awards: ["LWD Best Villa 2025", "Couples' Choice 2024", "Editor's Pick 2025"],
  press: ["Vogue", "HELLO!", "Tatler", "Harper's Bazaar"],
  imgs: [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=80",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=1920&q=80",
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80",
    "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?w=1920&q=80",
    "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1920&q=80",
  ],
  gallery: [
    { id: 1,  src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80", alt: "Grand ballroom ceremony setup with chandeliers and floral arch", tags: ["ceremony", "ballroom", "indoor", "chandelier", "floral"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 2,  src: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80", alt: "Bride and groom first dance under string lights", tags: ["first-dance", "reception", "evening", "string-lights", "couple"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 3,  src: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80", alt: "Outdoor garden ceremony with cypress tree backdrop", tags: ["ceremony", "garden", "outdoor", "cypress", "tuscan"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 4,  src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&q=80", alt: "Villa grounds at golden hour with rolling hills", tags: ["venue", "exterior", "golden-hour", "landscape", "tuscan-hills"], photographer: { name: "Lucia Conti", area: "Siena & Chianti", website: "luciaconti.com", instagram: "@luciaconti_weddings", camera: "Sony A7IV" } },
    { id: 5,  src: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800&q=80", alt: "Elegant table setting with gold details and candles", tags: ["table-setting", "reception", "details", "gold", "candlelight"], photographer: { name: "Lucia Conti", area: "Siena & Chianti", website: "luciaconti.com", instagram: "@luciaconti_weddings", camera: "Sony A7IV" } },
    { id: 6,  src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", alt: "Aerial view of villa estate and surrounding vineyards", tags: ["aerial", "drone", "estate", "vineyards", "landscape"], photographer: { name: "Drone Italia", area: "All Italy", website: "droneitalia.it", instagram: "@droneitalia", camera: "DJI Mavic 3" } },
    { id: 7,  src: "https://images.unsplash.com/photo-1583418855232-f0d0b13b77c9?w=800&q=80", alt: "Bridal bouquet with white roses and olive branch details", tags: ["bouquet", "flowers", "details", "bridal", "roses"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 8,  src: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800&q=80", alt: "Loggia terrace dinner setup overlooking the valley", tags: ["loggia", "dinner", "terrace", "sunset", "al-fresco"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 9,  src: "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?w=800&q=80", alt: "Candlelit salon with frescoed ceiling and parquet floor", tags: ["salon", "indoor", "evening", "frescoes", "candlelight"], photographer: { name: "Lucia Conti", area: "Siena & Chianti", website: "luciaconti.com", instagram: "@luciaconti_weddings", camera: "Sony A7IV" } },
    { id: 10, src: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80", alt: "Wedding party celebration on the grand terrace", tags: ["party", "celebration", "terrace", "group", "evening"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 11, src: "https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=800&q=80", alt: "Wine cellar intimate dinner for the wedding party", tags: ["cellar", "dinner", "intimate", "wine", "underground"], photographer: { name: "Lucia Conti", area: "Siena & Chianti", website: "luciaconti.com", instagram: "@luciaconti_weddings", camera: "Sony A7IV" } },
    { id: 12, src: "https://images.unsplash.com/photo-1551418320-5fe5f36d2d05?w=800&q=80", alt: "Confetti throw outside the chapel entrance", tags: ["confetti", "chapel", "celebration", "outdoor", "couple"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 13, src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80", alt: "Swimming pool area with sun terrace and lounge seating", tags: ["pool", "terrace", "exterior", "relaxation", "luxury"], photographer: { name: "Drone Italia", area: "All Italy", website: "droneitalia.it", instagram: "@droneitalia", camera: "DJI Mavic 3" } },
    { id: 14, src: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", alt: "Villa facade at twilight with warm interior glow", tags: ["villa", "exterior", "twilight", "architecture", "facade"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
    { id: 15, src: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80", alt: "Wine cellar archway with barrel room in background", tags: ["cellar", "architecture", "wine", "interior", "historic"], photographer: { name: "Lucia Conti", area: "Siena & Chianti", website: "luciaconti.com", instagram: "@luciaconti_weddings", camera: "Sony A7IV" } },
    { id: 16, src: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80", alt: "Bridal couple walking through olive grove at sunset", tags: ["couple", "olive-grove", "sunset", "portrait", "romantic"], photographer: { name: "Marco Bellini", area: "Florence & Tuscany", website: "marcobellini.it", instagram: "@marcobellini_photo", camera: "Canon R5" } },
  ],
  videos: [
    { id: 1, title: "Sofia & James — Tuscan Wedding Film", duration: "4:32", thumb: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80", type: "wedding", youtubeId: "LXb3EKWsInQ", desc: "A cinematic wedding film capturing Sofia and James's three-day celebration at Villa Rosanova, from the rehearsal dinner in the wine cellar to the sunset ceremony in the Cypress Garden.", tags: ["wedding-film", "ceremony", "reception", "tuscan", "cinematic"], videographer: { name: "Luca Visconti Films", area: "Florence & Tuscany", website: "lucavisconti.it", instagram: "@lucaviscontifilms", camera: "RED Komodo 6K" } },
    { id: 2, title: "Villa Rosanova — Estate Tour", duration: "2:15", thumb: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", type: "tour", youtubeId: "LXb3EKWsInQ", desc: "A guided aerial and ground-level tour of the estate — the Grand Salon, Cypress Garden, vineyard terraces, wine cellar and all 30 rooms and suites.", tags: ["estate-tour", "aerial", "drone", "property", "venue"], videographer: { name: "Drone Italia", area: "All Italy", website: "droneitalia.it", instagram: "@droneitalia", camera: "DJI Inspire 3" } },
    { id: 3, title: "Isabella & Marco — Highlights", duration: "3:48", thumb: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80", type: "wedding", youtubeId: "LXb3EKWsInQ", desc: "A highlight reel of Isabella and Marco's intimate summer wedding — 60 guests, an outdoor ceremony under the loggia, and a magical first dance beneath the chandeliers.", tags: ["wedding-film", "highlights", "intimate", "summer", "first-dance"], videographer: { name: "Luca Visconti Films", area: "Florence & Tuscany", website: "lucavisconti.it", instagram: "@lucaviscontifilms", camera: "Sony FX6" } },
  ],
  // ── Engagement data for rating/review system ──
  engagement: {
    photos: {
      1:  { likes: 24, avgRating: 4.8, ratingCount: 12, comments: [{ name: "Sarah M.", text: "Absolutely stunning ceremony setup. The chandeliers were magical!", rating: 5, date: "2025-11-14" }, { name: "James L.", text: "Beautiful capture of the ballroom atmosphere.", rating: 5, date: "2025-10-28" }] },
      2:  { likes: 31, avgRating: 4.9, ratingCount: 18, comments: [{ name: "Emma T.", text: "This first dance photo is everything! The string lights are dreamy.", rating: 5, date: "2025-12-02" }] },
      3:  { likes: 19, avgRating: 4.7, ratingCount: 9, comments: [{ name: "Rachel K.", text: "The cypress backdrop is incredible for photos.", rating: 5, date: "2025-09-18" }] },
      4:  { likes: 28, avgRating: 4.6, ratingCount: 14, comments: [{ name: "Michael R.", text: "Golden hour at its finest. Lucia really knows how to capture light.", rating: 4, date: "2025-10-05" }] },
      5:  { likes: 15, avgRating: 4.5, ratingCount: 7, comments: [] },
      6:  { likes: 22, avgRating: 4.8, ratingCount: 11, comments: [{ name: "Tom & Alice", text: "The aerial perspective really shows the full beauty of the estate.", rating: 5, date: "2025-11-22" }] },
      7:  { likes: 17, avgRating: 4.4, ratingCount: 8, comments: [] },
      8:  { likes: 26, avgRating: 4.9, ratingCount: 15, comments: [{ name: "Clara V.", text: "The terrace dinner setup overlooking the valley — pure magic.", rating: 5, date: "2025-12-10" }] },
      9:  { likes: 13, avgRating: 4.3, ratingCount: 6, comments: [] },
      10: { likes: 20, avgRating: 4.5, ratingCount: 10, comments: [] },
      11: { likes: 11, avgRating: 4.6, ratingCount: 5, comments: [] },
      12: { likes: 35, avgRating: 4.9, ratingCount: 21, comments: [{ name: "Sophie B.", text: "The confetti moment is everything! So much joy captured perfectly.", rating: 5, date: "2025-11-30" }, { name: "David H.", text: "Marco's timing is impeccable. What a shot!", rating: 5, date: "2025-12-05" }] },
      13: { likes: 14, avgRating: 4.4, ratingCount: 7, comments: [] },
      14: { likes: 29, avgRating: 4.8, ratingCount: 16, comments: [{ name: "Olivia N.", text: "The twilight facade shot sold us on this venue instantly.", rating: 5, date: "2025-10-15" }] },
      15: { likes: 10, avgRating: 4.3, ratingCount: 4, comments: [] },
      16: { likes: 38, avgRating: 5.0, ratingCount: 24, comments: [{ name: "Lily & George", text: "Walking through the olive grove at sunset — our favourite photo of the entire wedding.", rating: 5, date: "2025-12-15" }, { name: "Kate W.", text: "Marco is a genius. This is the most romantic photo I've ever seen.", rating: 5, date: "2025-12-18" }] },
    },
    videos: {
      1: { likes: 42, avgRating: 4.9, ratingCount: 23, comments: [{ name: "Sofia & James", text: "Luca captured our day perfectly. We cry every time we watch it!", rating: 5, date: "2025-11-20" }, { name: "Marie P.", text: "Absolutely cinematic. The drone shots over the vineyard are breathtaking.", rating: 5, date: "2025-12-01" }] },
      2: { likes: 18, avgRating: 4.6, ratingCount: 10, comments: [{ name: "Emily R.", text: "This tour really helped us decide on Villa Rosanova for our wedding.", rating: 5, date: "2025-10-12" }] },
      3: { likes: 36, avgRating: 4.8, ratingCount: 19, comments: [{ name: "Isabella & Marco", text: "The highlight reel is pure perfection. Thank you Luca!", rating: 5, date: "2025-12-08" }, { name: "Anna G.", text: "The first dance sequence gave me goosebumps. Stunning cinematography.", rating: 5, date: "2025-12-12" }] },
    },
  },
  notices: [
    {
      id: 4,
      type: "news",
      badge: "Estate News",
      title: "New Executive Chef — Lorenzo Conti",
      detail: "We are delighted to welcome Lorenzo Conti as our new Executive Chef. Lorenzo joins from a Michelin-starred kitchen in Florence, bringing a philosophy rooted in Tuscan terroir, seasonal produce and elegant simplicity.",
      img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
      imgCaption: "Lorenzo Conti · Executive Chef, Villa Rosanova",
      cta: "View sample menus",
    },
    {
      id: 1,
      type: "open-day",
      badge: "Open Day",
      title: "Spring Open Day",
      detail: "Saturday 22 March 2025 · 11am–4pm · Guided tours of all spaces, seasonal tastings and a chance to meet our full team.",
      img: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600&q=80",
      imgCaption: "The Cypress Garden · Villa Rosanova",
      cta: "Reserve your place",
    },
    {
      id: 2,
      type: "offer",
      badge: "Special Offer",
      title: "Early 2026 Booking Offer",
      detail: "10% off venue hire for June–September 2026 bookings confirmed before 31 March 2025. Includes complimentary cellar tour and welcome dinner for the wedding party.",
      img: "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?w=600&q=80",
      imgCaption: "The Grand Salon · candlelit dinner setting",
      cta: "Enquire now",
      expires: "31 Mar 2025",
    },
    {
      id: 3,
      type: "availability",
      badge: "Late Availability",
      title: "Saturday 14 June 2025",
      detail: "A rare cancellation has opened this peak-season date. The full estate is available for exclusive use. Contact us to secure it before it is offered publicly.",
      img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80",
      imgCaption: "Villa Rosanova · available 14 June 2025",
      cta: "Enquire About This Date",
    },
  ],
  exclusiveUse: {
    enabled: true,
    title: "Exclusive Use",
    subtitle: "Hire the entire estate — just your guests, your celebration, your way",
    from: "£28,000",
    subline: "Minimum 2 nights · Sleeps 40 guests",
    description: "When you book exclusive use of Villa Rosanova, the estate is entirely yours. No other guests. No other events. Just your family and friends in one of Italy's most extraordinary properties.",
    ctaText: "Enquire About Exclusive Use",
    includes: [
      "All 24 rooms & 6 suites",
      "Private grounds & gardens",
      "Full catering team",
      "Event & hospitality staff",
      "Bar facilities & cellar",
      "Bridal suite & prep rooms",
    ],
    minNights: 2,
  },
  catering: {
    enabled: true,
    cards: [
      {
        id: 'c1',
        icon: 'dining',
        title: 'In-house catering',
        description: 'Our culinary team sources produce from the estate and surrounding farms. Seasonal menus designed around your wedding day.',
        subtext: '',
        sortOrder: 0,
      },
      {
        id: 'c2',
        icon: 'cooking',
        title: 'External caterers',
        description: 'External caterers welcome. Corkage fee £18 per bottle.',
        subtext: '',
        sortOrder: 1,
      },
      {
        id: 'c3',
        icon: 'wine',
        title: 'Sommelier service',
        description: 'Our sommelier will curate a bespoke wine journey from our private cellar. Private cellar with over 800 labels.',
        subtext: '',
        sortOrder: 2,
      },
    ],
    styles: ["Fine dining", "Banquet", "Family style", "Food stations", "Late-night snacks"],
    dietary: ["Vegan", "Vegetarian", "Halal", "Kosher", "Gluten-free"],
  },
  spaces: [
    {
      id: 's1', name: 'The Grand Salon', type: 'Ballroom', sortOrder: 1,
      description: 'Frescoed 18th-century ballroom with original parquet floors and three Venetian chandeliers. The crown jewel of Villa Rosanova, bathed in golden candlelight.',
      capacityCeremony: 160, capacityReception: 200, capacityDining: 160, capacityStanding: 220,
      indoor: true, covered: true, accessible: true,
      img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
      floorPlanUrl: null,
    },
    {
      id: 's2', name: 'The Cypress Garden', type: 'Garden', sortOrder: 2,
      description: 'Formal Italian garden framed by century-old cypress trees. The natural amphitheatre and south-facing orientation make it the ideal setting for outdoor ceremonies at sunset.',
      capacityCeremony: 200, capacityReception: 180, capacityDining: null, capacityStanding: 250,
      indoor: false, covered: false, accessible: true,
      img: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&q=80',
      floorPlanUrl: null,
    },
    {
      id: 's3', name: 'The Loggia', type: 'Terrace', sortOrder: 3,
      description: 'A covered stone terrace overlooking the vineyard — perfect for cocktail receptions and aperitivo as the vines glow gold at dusk. Heated in cooler months.',
      capacityCeremony: null, capacityReception: 80, capacityDining: 50, capacityStanding: 100,
      indoor: false, covered: true, accessible: true,
      img: 'https://images.unsplash.com/photo-1464808322410-1a934aab61e5?w=800&q=80',
      floorPlanUrl: null,
    },
    {
      id: 's4', name: 'The Wine Cellar', type: 'Private Dining Room', sortOrder: 4,
      description: 'Intimate vaulted 14th-century cellar for private dinners, barrel tastings and late-night celebrations. Surrounded by the estate\'s finest bottles.',
      capacityCeremony: null, capacityReception: null, capacityDining: 30, capacityStanding: 40,
      indoor: true, covered: true, accessible: false,
      img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
      floorPlanUrl: null,
    },
    {
      id: 's5', name: 'The Poolside Terrace', type: 'Poolside Area', sortOrder: 5,
      description: 'A sleek infinity terrace beside the heated pool, overlooking the valley. The setting for legendary Sunday brunches and evening cocktail parties under the stars.',
      capacityCeremony: null, capacityReception: 60, capacityDining: null, capacityStanding: 80,
      indoor: false, covered: false, accessible: true,
      img: 'https://images.unsplash.com/photo-1540541338537-9c86a1dd9f23?w=800&q=80',
      floorPlanUrl: null,
    },
  ],
  experiences: [
    { id: "e1", label: "Private wine cellar tasting",       category: "estate", kind: "wine",    isIncluded: true, season: "all-year" },
    { id: "e2", label: "Full spa and wellness suite",        category: "estate", kind: "spa",     isIncluded: true, season: "all-year" },
    { id: "e3", label: "Heated infinity pool and sun terrace", category: "estate", kind: "pool",  isIncluded: true, season: "summer" },
    { id: "e4", label: "Tuscan cooking class with our chef", category: "estate", kind: "cooking", isPrivate: true, season: "all-year" },
    { id: "e5", label: "Vintage Alfa Romeo estate collection", category: "estate", kind: "car",  isPrivate: true },
    { id: "e6", label: "Olive oil and truffle estate tour",  category: "estate", kind: "truffle", season: "autumn" },
    { id: "e7", label: "Antinori vineyard tours",            category: "nearby", kind: "vineyard", distanceMinutes: 12 },
    { id: "e8", label: "Private Florence gallery experience", category: "nearby", kind: "museum",  distanceMinutes: 30 },
    { id: "e9", label: "Golf Club Ugolino",                  category: "nearby", kind: "golf",    distanceMinutes: 15 },
    { id: "e10", label: "Truffle hunting with local guide",  category: "nearby", kind: "truffle", distanceMinutes: 20 },
    { id: "e11", label: "Arno river private boat",           category: "nearby", kind: "boat",   distanceMinutes: 35 },
    { id: "e12", label: "Private Uffizi after-hours visit",  category: "nearby", kind: "culture", distanceMinutes: 30 },
  ],
  access: {
    helicopterTransferAvailable: true,
    helicopterTransferMinutesFromAirport: 20,
    airports: [
      { code: "FLR", name: "Florence", driveTimeMinutes: 45, distanceKm: 42 },
      { code: "PSA", name: "Pisa Galileo Galilei", driveTimeMinutes: 70, distanceKm: 88 },
      { code: "BLQ", name: "Bologna Marconi", driveTimeMinutes: 90, distanceKm: 115 },
      { code: "FCO", name: "Rome Fiumicino", driveTimeMinutes: 160, distanceKm: 285 },
    ],
    get primaryAirport() { return this.airports.reduce((a, b) => a.driveTimeMinutes < b.driveTimeMinutes ? a : b); },
  },
  testimonials: [
    { id: 1, names: "Charlotte & Oliver", date: "September 2024", location: "London, UK", rating: 5, text: "Villa Rosanova was everything we dreamed of and more. Our 140 guests flew in from 14 countries — every single one said it was the most beautiful wedding they had ever attended.", avatar: "CO" },
    { id: 2, names: "Sophia & Marco", date: "June 2024", location: "New York, USA", rating: 5, text: "We hosted a 4-day wedding weekend for 90 guests. The staff anticipated every need. The food was extraordinary — our guests still talk about the truffle risotto and the private cellar dinner on night three.", avatar: "SM" },
    { id: 3, names: "Amelia & James", date: "May 2024", location: "Dubai, UAE", rating: 5, text: "From the helicopter arrival to the farewell prosecco on the terrace — every moment was flawlessly orchestrated. The Cypress Garden ceremony at sunset is something we will never forget.", avatar: "AJ" },
  ],
  similar: [
    { id: 2, name: "Castello di Velona", location: "Montalcino, Tuscany", price: "£14,500", rating: 4.8, img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80" },
    { id: 3, name: "Villa del Balbianello", location: "Lake Como, Lombardy", price: "£18,000", rating: 4.9, img: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400&q=80" },
    { id: 4, name: "Convento di Amalfi", location: "Amalfi Coast", price: "£16,500", rating: 4.7, img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80" },
  ],
  contact: {
    address: {
      line1: "Via Scopeti 19",
      city: "San Casciano in Val di Pesa",
      region: "Tuscany",
      postcode: "50026",
      country: "Italy",
      latitude: 43.6567,
      longitude: 11.1847,
    },
    phone: "+39 055 820 0700",
    email: "events@villarosanova.it",
    website: "www.villarosanova.it",
    responseMetrics: {
      averageResponseHours: 2,
      responseRatePercent: 98,
      sameDayTypical: true,
    },
  },
  // null type = no video hero (falls back to image slider)
  video: {
    type: "youtube",  // "youtube" | "vimeo" | null
    heroId: "LXb3EKWsInQ",
    filmId: "LXb3EKWsInQ",
  },
  owner: {
    name: "Isabella Rosanova",
    title: "Estate Director",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&q=80",
    bio: "We have hosted over 300 weddings at Villa Rosanova across four decades. I personally oversee every celebration to ensure it exceeds every expectation.",
    memberSince: 2019,
  },
  weddingWeekend: {
    enabled: true,
    subtitle: "Villa Rosanova is designed for multi-day celebrations — a full wedding weekend experience",
    days: [
      { id: 'd1', day: "Thursday",  title: "Arrival Day",       desc: "Guests settle in. Welcome drinks on the loggia. Private vineyard tour at golden hour.", sortOrder: 0 },
      { id: 'd2', day: "Friday",    title: "Welcome Evening",   desc: "Rehearsal dinner in the wine cellar. Intimate, candlelit, unforgettable.", sortOrder: 1 },
      { id: 'd3', day: "Saturday",  title: "The Wedding",       desc: "Ceremony in the Cypress Garden. Reception in the Grand Salon. Celebrate until dawn.", sortOrder: 2 },
      { id: 'd4', day: "Sunday",    title: "Farewell Brunch",   desc: "Late breakfast on the terrace. Final toasts. Memories that last a lifetime.", sortOrder: 3 },
    ],
  },
  estateEnabled: true,
  nearbyEnabled: true,
  faq: {
    enabled: true,
    title: "Your Guide to Villa Rosanova",
    subtitle: "Curated answers to every question — from your first enquiry to your final farewell toast.",
    ctaEnabled: true,
    ctaHeadline: "Still have a question?",
    ctaSubtext: "Our team responds within 2 hours — we'd love to help.",
    ctaButtonText: "Ask a question",
    categories: [
      {
        category: "The Venue", icon: "I",
        questions: [
          { q: "Is Villa Rosanova available for exclusive use?", a: "Yes — Villa Rosanova is available for exclusive hire from Thursday to Sunday. Exclusive use includes all 24 bedrooms and 6 suites, full use of the grounds, gardens, pool pavilion and all venue spaces. Pricing from £28,000 for the full weekend." },
          { q: "What is the maximum guest capacity?", a: "The estate accommodates up to 200 guests for a ceremony, 160 for a seated dinner and 180 for a standing reception. For intimate celebrations, we welcome parties from 20 guests." },
          { q: "Can we hold both the ceremony and reception here?", a: "Absolutely. The Cypress Garden seats 200 for outdoor ceremonies, while the Grand Salon accommodates 160 for indoor ceremonies. All reception spaces are on the same estate." },
        ],
      },
      {
        category: "Catering & Drink", icon: "II",
        questions: [
          { q: "Do you work with an in-house caterer or can we bring our own?", a: "We have an award-winning in-house culinary team led by Chef Marco Bellini. External caterers are permitted with prior approval and a corkage arrangement. Our sommelier curates a bespoke wine list featuring our own estate Chianti Classico." },
          { q: "Can you accommodate dietary requirements?", a: "Yes — our kitchen is fully equipped to cater for vegan, vegetarian, halal, kosher and gluten-free guests. Please advise your dedicated event planner of any requirements when confirming your booking." },
          { q: "Is there a corkage fee if we bring our own wine?", a: "External wine and spirits are welcome at £18 per bottle. We recommend our estate wine list as a first choice — our Chianti Classico is particularly popular with guests." },
        ],
      },
      {
        category: "Accommodation", icon: "III",
        questions: [
          { q: "How many guests can stay on the estate overnight?", a: "Villa Rosanova sleeps 58 guests across 24 bedrooms and 6 suites. All rooms are uniquely decorated and include en-suite bathrooms. Bridal and groom suites are available with dedicated dressing areas." },
          { q: "What are the check-in and check-out times?", a: "Check-in is from 3pm on your arrival day. Check-out is by 11am on your departure day. For exclusive use bookings, we are flexible around your schedule — please discuss timing with your event planner." },
        ],
      },
      {
        category: "Getting Here", icon: "IV",
        questions: [
          { q: "What is the closest airport?", a: "Florence Airport (FLR) is 45 minutes by car (42km). We can arrange private transfers and helicopter arrivals from FLR — 20 minutes by helicopter. Pisa (PSA) is 70 minutes and Bologna (BLQ) is 90 minutes." },
          { q: "Is there parking on the estate?", a: "Yes — complimentary secure parking for up to 60 vehicles within the estate grounds. For larger parties, additional overflow parking is available 200m from the entrance with a complimentary shuttle." },
        ],
      },
    ],
  },
  similarVenuesEnabled: true,
  recentlyViewedEnabled: true,
};

// ─── COMPUTED BACKWARD-COMPAT FIELDS ─────────────────────────────────────────
// These derive from structured data so older references (sidebar, chat, etc.) keep working.
VENUE.responseTime = `${VENUE.contact.responseMetrics.averageResponseHours} hrs`;
VENUE.responseRate = VENUE.contact.responseMetrics.responseRatePercent;
VENUE.contact.mapQuery = `${VENUE.contact.address.city},+${VENUE.contact.address.region},+${VENUE.contact.address.country}`.replace(/ /g, "+");
VENUE.contact.addressFormatted = [
  VENUE.contact.address.line1,
  VENUE.contact.address.city,
  `${VENUE.contact.address.postcode} ${VENUE.contact.address.region}`,
  VENUE.contact.address.country,
].join(", ");

// ─── RECENTLY VIEWED — localStorage helpers ────────────────────────────────────
const RV_KEY = 'ldw_recently_viewed';
const MAX_RV_STORED = 6;

function getRVList() {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch { return []; }
}

function recordVenueView(v) {
  try {
    const entry = {
      id: v.id, name: v.name, location: v.location,
      rating: v.rating, price: v.priceFrom,
      img: v.imgs?.[0] || v.gallery?.[0] || '',
      viewedAt: Date.now(),
    };
    const updated = [entry, ...getRVList().filter(x => x.id !== entry.id)].slice(0, MAX_RV_STORED);
    localStorage.setItem(RV_KEY, JSON.stringify(updated));
  } catch { /* localStorage unavailable */ }
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { font-family: ${FB}; -webkit-font-smoothing: antialiased; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(157,135,62,0.3); border-radius: 3px; }
      @keyframes fadeUp      { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
      @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes slideUp     { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
      @keyframes kenBurns    { 0%{transform:scale(1)} 100%{transform:scale(1.06)} }
      @keyframes chatModalIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.93); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      @keyframes dotPulse    { 0%,80%,100% { transform:scale(0); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }
      @keyframes lightbox-progress { from { width:0 } to { width:100% } }
      .lwd-thumb-strip::-webkit-scrollbar { display:none; }
      @keyframes barPulse    { 0%,100% { box-shadow:0 4px 32px rgba(0,0,0,0.08),0 0 0 1px rgba(201,168,76,0.18); } 50% { box-shadow:0 6px 40px rgba(201,168,76,0.15),0 0 0 1.5px rgba(201,168,76,0.38); } }
      @keyframes lwd-modal-in { from { opacity:0; transform:translateY(18px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      .lwd-aura-bar { bottom: 28px !important; }
      @media (max-width: 900px) { .lwd-aura-bar { bottom: 80px !important; } }
      .lwd-img-zoom { transition: transform 0.7s ease; }
      .lwd-img-zoom:hover { transform: scale(1.04); }
      *:hover > .lwd-tag-overlay { opacity: 1 !important; }
      .lwd-fade-up { animation: fadeUp 0.6s ease both; }
      @media (max-width: 900px) { .lwd-sidebar { display: none !important; } .lwd-mobile-bar { display: flex !important; } }
      @media (min-width: 901px) { .lwd-mobile-bar { display: none !important; } }
    `}</style>
  );
}

// ─── EXPERIENCE TAXONOMY ────────────────────────────────────────────────────
const EXPERIENCE_KINDS = Object.freeze([
  "vineyard", "wine", "truffle", "cooking", "dining", "spa", "pool", "golf",
  "boat", "beach", "mountain", "museum", "culture", "tour", "helicopter",
  "airport", "car", "wellness", "nature", "hiking", "safari", "ski", "island", "rail",
]);
const EXPERIENCE_KIND_SET = new Set(EXPERIENCE_KINDS);

// ─── ICON MAP (SVG paths, stroke-based, 24×24 viewBox) ─────────────────────
const ICON_PATHS = Object.freeze({
  vineyard:   "M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11zM12 22v-6",
  wine:       "M8 2h8l-1 8a5 5 0 01-6 0L8 2zM12 14v8M8 22h8M12 10v0",
  truffle:    "M12 6a6 6 0 100 12 6 6 0 000-12zM9 10.5a1.5 1.5 0 110 .01M15 10.5a1.5 1.5 0 110 .01M11 14a1 1 0 110 .01M12 2v4",
  cooking:    "M12 2v4M6 6h12v3a6 6 0 01-12 0V6zM12 15v5M8 22h8M4 6h16",
  dining:     "M3 6h18M7 6v-2a2 2 0 014 0v2M13 6v-2a2 2 0 014 0v2M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14",
  spa:        "M12 8c-3 0-6 2-6 6v2h12v-2c0-4-3-6-6-6zM12 2v2M8 4l1 2M16 4l-1 2M6 18c0 2 2.7 4 6 4s6-2 6-4",
  pool:       "M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  golf:       "M12 2v14M12 16a4 4 0 01-4 4h8a4 4 0 01-4-4zM12 6l6-2",
  boat:       "M2 16l2-2h16l2 2M4 14V8l4-4h8l4 4v6M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  beach:      "M2 20h20M6 20v-4M18 20v-4M6 16h12M9 8a3 3 0 106 0M12 2v3",
  mountain:   "M2 20L8 8l4 6 4-6 6 12H2z",
  museum:     "M3 21h18M5 21V10M19 21V10M3 10l9-7 9 7M9 21v-5h6v5",
  culture:    "M4 20h16M12 4v2M7 9a5 5 0 0010 0M5 14h14M8 14v6M16 14v6",
  tour:       "M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zM12 12a3 3 0 110-6 3 3 0 010 6z",
  helicopter: "M12 14l-4 6h8l-4-6zM2 6h20M12 6v8M7 2v8M17 2v8",
  airport:    "M12 2L2 8h20L12 2zM4 8v8h16V8M8 16v4M16 16v4M2 22h20",
  car:        "M3 14h18v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM5 14l2-6h10l2 6M6.5 17.5a1 1 0 110-2 1 1 0 010 2zM17.5 17.5a1 1 0 110-2 1 1 0 010 2z",
  wellness:   "M12 2a4 4 0 014 4c0 2-2 6-4 6s-4-4-4-6a4 4 0 014-4zM12 12c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  nature:     "M12 2l-2 6h4l-2-6zM12 8c-5 0-8 3-8 7h16c0-4-3-7-8-7zM12 15c-6 0-10 2-10 5h20c0-3-4-5-10-5zM12 20v2",
  hiking:     "M13 4a2 2 0 110-4 2 2 0 010 4zM10 8l-4 8h3l2 6h4l2-6h3l-4-8h-6z",
  safari:     "M12 2c-4 0-8 3.6-8 8s8 12 8 12 8-7.6 8-12-4-8-8-8zM9 9h0M15 9h0M9 13c1.5 2 4.5 2 6 0",
  ski:        "M2 20l6-6M10 14l8-8M14 4l4 4M12 2l-2 6h4l-2-6z",
  island:     "M2 16c3-4 6-6 10-6s7 2 10 6M7 16c1-2 2-6 5-6s4 4 5 6M12 10V6M10 6h4",
  rail:       "M5 4h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4zM5 4a2 2 0 012-2h10a2 2 0 012 2M8 20l-2 2M16 20l2 2M5 12h14M8.5 15.5a1 1 0 110-2M15.5 15.5a1 1 0 110-2",
  // ── Utility icons (for Contact, Access, UI) ──
  pin:        "M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zM12 12a3 3 0 110-6 3 3 0 010 6z",
  phone:      "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  email:      "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  globe:      "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10A15 15 0 0112 2z",
  clock:      "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",
  check:      "M20 6L9 17l-5-5",
  zap:        "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
});

function Icon({ name, size = 18, color, style: extraStyle }) {
  const C = useT();
  const d = ICON_PATHS[name];
  if (!d) {
    if (typeof window !== "undefined" && window.__LWD_DEV) console.warn(`[LWD] Unknown icon: "${name}"`);
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || C.textMid}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...extraStyle }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

// ─── STARS ───────────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }) {
  const C = useT();
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.floor(rating) ? C.gold : i - 0.5 <= rating ? C.gold : C.border2 }}>★</span>
      ))}
    </span>
  );
}

// ─── SECTION HEADING ─────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle }) {
  const C = useT();
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: FD, fontSize: 32, fontWeight: 400, color: C.text, letterSpacing: "-0.3px", lineHeight: 1.15, marginBottom: 10 }}>{title}</h2>
      <div style={{ width: 48, height: 2, backgroundImage: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />
      {subtitle && <p style={{ fontFamily: FB, fontSize: 15, color: C.textLight, marginTop: 12, lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

// ─── PILL / BADGE ─────────────────────────────────────────────────────────────
function Pill({ children, color }) {
  const C = useT();
  const clr = color === "gold" ? C.gold : color === "green" ? C.green : C.textLight;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: `1px solid ${clr}22`, background: `${clr}10`, color: clr, fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ darkMode, setDarkMode, saved, setSaved, compareList, onAddCompare, onBack }) {
  const C = useT();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── colour tokens that change based on scroll + theme ──
  const navBg     = scrolled ? C.navBg    : "transparent";
  const navBorder = scrolled ? (darkMode ? `1px solid ${C.goldBorder}` : `1px solid ${C.border}`) : "none";
  const logoColor = scrolled ? C.gold     : "#ffffff";
  const wordColor = scrolled ? C.textMuted : "rgba(255,255,255,0.45)";
  const crumbColor = scrolled ? C.textMuted : "rgba(255,255,255,0.5)";
  const crumbActive = scrolled ? C.gold   : "rgba(255,255,255,0.9)";
  const btnBorder = (active) => active
    ? C.gold
    : scrolled ? C.border2 : "rgba(255,255,255,0.28)";
  const btnColor  = (active) => active
    ? C.gold
    : scrolled ? C.textMid : "rgba(255,255,255,0.82)";
  const btnBg     = (active) => active ? C.goldLight : "transparent";

  return (
    <nav className="vp-nav" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: navBg,
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      borderBottom: navBorder,
      padding: "0 40px", height: 72,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "background 0.35s ease, border-color 0.35s ease",
    }}>

      {/* ── Logo + breadcrumb ── */}
      <div className="vp-nav-left" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{
            fontFamily: FD, fontSize: 21, fontWeight: 400,
            color: logoColor, letterSpacing: "2.5px",
            lineHeight: 1, transition: "color 0.35s",
          }}>
            LUXURY WEDDING DIRECTORY
          </div>
          <div style={{
            width: "100%", height: 1,
            background: scrolled
              ? `linear-gradient(90deg, ${C.gold}, ${C.green})`
              : "rgba(255,255,255,0.22)",
            transition: "opacity 0.35s",
          }} />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: scrolled ? C.border : "rgba(255,255,255,0.2)" }} />

        {/* Breadcrumb */}
        <div className="vp-breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FB, fontSize: 12, letterSpacing: "0.2px" }}>
          {["Venues", "Italy", "Tuscany"].map((crumb) => (
            <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ color: crumbColor, cursor: "pointer", transition: "color 0.2s" }}
                onClick={crumb === "Venues" && onBack ? onBack : undefined}
                onMouseEnter={e => e.currentTarget.style.color = crumbActive}
                onMouseLeave={e => e.currentTarget.style.color = crumbColor}
              >{crumb}</span>
              <span style={{ color: scrolled ? C.border2 : "rgba(255,255,255,0.25)", fontSize: 10 }}>›</span>
            </span>
          ))}
          <span style={{ color: crumbActive, fontWeight: 600 }}>Villa Rosanova</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="vp-nav-actions" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { label: saved ? "♥  Saved" : "♡  Save",  action: () => setSaved(s => !s), active: saved },
          { label: "⊕  Compare", action: onAddCompare,   active: compareList.length > 0 },
          { label: "↗  Share",   action: () => {},        active: false },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = btnBorder(btn.active); e.currentTarget.style.color = btnColor(btn.active); }}
            style={{
              padding: "8px 16px", fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.6px",
              textTransform: "uppercase",
              background: btnBg(btn.active),
              border: `1px solid ${btnBorder(btn.active)}`,
              borderRadius: "var(--lwd-radius-input)",
              color: btnColor(btn.active),
              cursor: "pointer", transition: "all 0.2s",
            }}>{btn.label}
          </button>
        ))}

        {/* Dark / light toggle */}
        <button onClick={() => setDarkMode(d => !d)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = scrolled ? C.border2 : "rgba(255,255,255,0.28)"; e.currentTarget.style.color = scrolled ? C.textMid : "rgba(255,255,255,0.82)"; }}
          style={{
            width: 38, height: 38, marginLeft: 4,
            border: `1px solid ${scrolled ? C.border2 : "rgba(255,255,255,0.28)"}`,
            borderRadius: "var(--lwd-radius-input)",
            background: "none", color: scrolled ? C.textMid : "rgba(255,255,255,0.82)",
            fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>{darkMode ? "☀" : "☽"}
        </button>
      </div>
    </nav>
  );
}

// ─── HERO SLIDER (shared) ────────────────────────────────────────────────────
function HeroSlider({ imgs, height, children }) {
  const C = useT();
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (hovered) return;
    const t = setInterval(() => setIdx(i => (i + 1) % imgs.length), 5000);
    return () => clearInterval(t);
  }, [hovered, imgs.length]);
  return (
    <div style={{ position: "relative", height, overflow: "hidden" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {imgs.map((img, i) => (
        <div key={i} style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: i === idx ? 1 : 0,
          animation: i === idx ? "kenBurns 8s ease forwards" : "none",
          transition: "opacity 1.2s ease",
        }} />
      ))}
      {children}
      {/* Arrows */}
      {[{ dir: "←", l: 16, r: "auto" }, { dir: "→", l: "auto", r: 16 }].map(a => (
        <button key={a.dir}
          onClick={() => setIdx(i => a.dir === "←" ? (i - 1 + imgs.length) % imgs.length : (i + 1) % imgs.length)}
          style={{
            position: "absolute", top: "50%", left: a.l, right: a.r,
            transform: "translateY(-50%)", width: 40, height: 40,
            border: "1px solid rgba(255,255,255,0.4)", borderRadius: "var(--lwd-radius-input)",
            background: "rgba(0,0,0,0.22)",
            backdropFilter: "blur(8px)", color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{a.dir}</button>
      ))}
      {/* Dots */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
        {imgs.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 20 : 6, height: 6, border: "none", cursor: "pointer",
            background: i === idx ? C.gold : "rgba(255,255,255,0.5)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── HERO STYLE 1: CINEMATIC ─────────────────────────────────────────────────
function HeroCinematic({ venue, onEnquire }) {
  const C = useT();
  return (
    <div style={{ position: "relative" }}>
      <HeroSlider imgs={venue.imgs} height="62vh">
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.75) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 52px", animation: "fadeUp 0.8s ease both" }}>
          {venue.featured && (
            <div style={{ display: "inline-flex", marginBottom: 12, padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(157,135,62,0.18)" }}>
              <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
            </div>
          )}
          <h1 style={{ fontFamily: FD, fontSize: "clamp(38px, 5.3vw, 68px)", fontWeight: 400, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.05, marginBottom: 12 }}>{venue.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{venue.flag} {venue.location}</span>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.3)" }} />
            <Stars rating={venue.rating} size={13} />
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{venue.rating}</span>
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>({venue.reviews} reviews)</span>
            {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ LWD Verified</span>}
          </div>
          {/* Hero CTA */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={onEnquire} style={{
              padding: "14px 28px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
              color: "#0f0d0a", fontFamily: FB, fontSize: 13, fontWeight: 800,
              letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Begin Your Enquiry →</button>
            <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.55)", letterSpacing: "0.3px" }}>
              From {venue.priceFrom} · Replies in {venue.responseTime}
            </span>
          </div>
        </div>
      </HeroSlider>
    </div>
  );
}

// ─── HERO STYLE 2: EDITORIAL SPLIT ───────────────────────────────────────────
function HeroSplit({ venue, onEnquire }) {
  const C = useT();
  const isMobile = useIsMobile();
  return (
    <div className="vp-hero-grid" style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "58% 42%",
      height: isMobile ? "auto" : "62vh",
      marginTop: 64,
    }}>
      {/* Image — top on mobile, left on desktop */}
      <HeroSlider imgs={venue.imgs} height={isMobile ? "44vh" : "100%"}>
        {venue.featured && (
          <div style={{ position: "absolute", top: 20, left: 20, display: "inline-flex", padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
            <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
          </div>
        )}
      </HeroSlider>
      {/* Info — below on mobile, right on desktop */}
      <div style={{
        background: C.surface,
        borderLeft: isMobile ? "none" : `1px solid ${C.border}`,
        borderTop: isMobile ? `1px solid ${C.border}` : "none",
        padding: isMobile ? "24px 20px 28px" : "40px 44px",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 14 : 20, flexWrap: "wrap" }}>
          {venue.categories.map(cat => <Pill key={cat} color="gold">{cat}</Pill>)}
        </div>
        <h1 style={{ fontFamily: FD, fontSize: isMobile ? 32 : "clamp(30px, 3.5vw, 52px)", fontWeight: 400, color: C.text, lineHeight: 1.05, marginBottom: 8 }}>{venue.name}</h1>
        <p style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginBottom: isMobile ? 14 : 20, lineHeight: 1.6 }}>{venue.flag} {venue.location}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 16 : 24, flexWrap: "wrap" }}>
          <Stars rating={venue.rating} size={14} />
          <span style={{ fontFamily: FB, fontSize: 14, fontWeight: 700, color: C.text }}>{venue.rating}</span>
          <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>· {venue.reviews} reviews</span>
          {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Verified</span>}
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: isMobile ? 16 : 24 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 24, gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <div>
            <div style={{ fontFamily: FD, fontSize: isMobile ? 24 : 28, color: C.gold }}>From {venue.priceFrom}</div>
            <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 2 }}>per event · up to {venue.capacity.ceremony} guests</div>
          </div>
          <div style={{ fontFamily: FB, fontSize: 12, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Icon name="zap" size={13} color={C.green} /> Replies in {venue.responseTime}</div>
        </div>
        <button onClick={onEnquire} style={{ width: "100%", padding: isMobile ? "13px" : "14px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)", color: "#0f0d0a", fontFamily: FB, fontSize: 13, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Begin Your Enquiry →
        </button>
      </div>
    </div>
  );
}

// ─── HERO STYLE 3: MAGAZINE BANNER ───────────────────────────────────────────
function HeroMagazine({ venue, onEnquire }) {
  const C = useT();
  return (
    <div>
      <HeroSlider imgs={venue.imgs} height="48vh">
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />
        {venue.featured && (
          <div style={{ position: "absolute", top: 80, left: 40 }}>
            <div style={{ display: "inline-flex", padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(0,0,0,0.45)" }}>
              <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
            </div>
          </div>
        )}
      </HeroSlider>
      {/* Title below image */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "28px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: FD, fontSize: "clamp(28px, 4vw, 54px)", fontWeight: 400, color: C.text, lineHeight: 1.05, marginBottom: 8 }}>{venue.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>{venue.flag} {venue.location}</span>
              <span style={{ width: 1, height: 12, background: C.border2 }} />
              <Stars rating={venue.rating} size={13} />
              <span style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: C.text }}>{venue.rating}</span>
              <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>({venue.reviews} reviews)</span>
              {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ LWD Verified</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FD, fontSize: 26, color: C.gold }}>From {venue.priceFrom}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>per event</div>
            </div>
            <button onClick={onEnquire} style={{
              padding: "13px 22px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
              color: "#0f0d0a", fontFamily: FB, fontSize: 12, fontWeight: 800,
              letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer",
              whiteSpace: "nowrap", transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Begin Your Enquiry →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HERO STYLE 4: VIDEO (YouTube / Vimeo) ───────────────────────────────────
function HeroVideo({ venue, onEnquire }) {
  const C = useT();
  const [filmOpen, setFilmOpen] = useState(false);
  const { type, heroId, filmId } = venue.video || {};

  const embedUrl = type === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${heroId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${heroId}&showinfo=0&iv_load_policy=3&disablekb=1&playsinline=1`
    : `https://player.vimeo.com/video/${heroId}?autoplay=1&loop=1&muted=1&background=1`;

  const filmUrl = type === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${filmId}?autoplay=1&rel=0&modestbranding=1`
    : `https://player.vimeo.com/video/${filmId}?autoplay=1`;

  return (
    <div style={{ position: "relative", height: "62vh", overflow: "hidden", background: "#111" }}>
      {/* iframe scaled 120% to hide YouTube edge UI */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "120%", height: "120%",
        pointerEvents: "none",
      }}>
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; fullscreen; picture-in-picture"
          title="Venue hero video"
        />
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 40%, rgba(0,0,0,0.72) 100%)",
        pointerEvents: "none",
      }} />

      {/* Content — same layout as Cinematic */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 52px", animation: "fadeUp 0.8s ease both" }}>
        {venue.featured && (
          <div style={{ display: "inline-flex", marginBottom: 12, padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(157,135,62,0.18)" }}>
            <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
          </div>
        )}
        <h1 style={{ fontFamily: FD, fontSize: "clamp(38px, 5.3vw, 68px)", fontWeight: 400, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.05, marginBottom: 14 }}>{venue.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
          <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{venue.flag} {venue.location}</span>
          <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.3)" }} />
          <Stars rating={venue.rating} size={13} />
          <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{venue.rating}</span>
          <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>({venue.reviews} reviews)</span>
          {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ LWD Verified</span>}
        </div>
        {/* Hero CTAs */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={onEnquire} style={{
            padding: "14px 28px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#0f0d0a", fontFamily: FB, fontSize: 13, fontWeight: 800,
            letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer", transition: "opacity 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Begin Your Enquiry →</button>
          {/* Watch film CTA */}
          <button onClick={() => setFilmOpen(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "9px 20px",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.32)",
            borderRadius: "var(--lwd-radius-input)",
            color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.6px", textTransform: "uppercase", cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          >
            <span style={{ fontSize: 14 }}>▶</span> Watch the film
          </button>
        </div>
      </div>

      {/* Film lightbox */}
      {filmOpen && (
        <div onClick={() => setFilmOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)", zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "90vw", maxWidth: 1024 }}>
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe
                src={filmUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Venue film"
              />
            </div>
            <button onClick={() => setFilmOpen(false)} style={{
              position: "absolute", top: -48, right: 0,
              background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.7)", fontSize: 22, width: 40, height: 40,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STICKY TAB NAV ───────────────────────────────────────────────────────────
const TABS = [
  // Luxury venue reading journey: narrative → experience → logistics → validation
  { key: 'overview',     label: 'Overview',       show: (v) => true },
  { key: 'rooms',        label: 'Rooms',          show: (v) => v.accommodation?.totalRooms > 0 || v.accommodation?.description },
  { key: 'weekend',      label: 'Wedding Weekend', show: (v) => v.weddingWeekend?.enabled !== false && (v.weddingWeekend?.days?.length || 0) > 0 },
  { key: 'dining',       label: 'Dining',         show: (v) => v.dining?.description || v.dining?.style },
  { key: 'experiences',  label: 'Experiences',    show: (v) => (v.estateEnabled || v.nearbyEnabled) && ((v.estate_items?.length || 0) + (v.nearby_items?.length || 0) > 0) },
  { key: 'travel',       label: 'Travel & Access', show: (v) => (v.access?.arrival?.airports?.length || 0) > 0 },
  { key: 'contact',      label: 'Contact',        show: (v) => !!v.contact?.email },
  { key: 'gallery',      label: 'Gallery',        show: (v) => (v.gallery?.length || 0) > 0 },
  { key: 'reviews',      label: 'Reviews',        show: (v) => (v.testimonials?.length || 0) > 0 },
  { key: 'faqs',         label: 'FAQs',           show: (v) => v.faq?.enabled !== false },
];

function StickyTabNav({ venue, activeTab, onTabClick }) {
  const C = useT();
  const isMobile = useIsMobile();
  const visibleTabs = TABS.filter(t => t.show(venue));

  if (isMobile) {
    return (
      <div style={{
        position: 'sticky', top: 56, zIndex: 50,
        backgroundColor: C.navBg || C.bg, borderBottom: `1px solid ${C.border}`,
        padding: '10px 20px',
        backdropFilter: 'blur(12px)',
      }}>
        <select
          value={activeTab}
          onChange={e => onTabClick(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px',
            fontSize: 14, fontFamily: 'inherit',
            border: `1px solid ${C.border}`,
            borderRadius: 'var(--lwd-radius-input, 3px)',
            backgroundColor: C.surface,
            color: C.text,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: 40,
            cursor: 'pointer',
          }}
        >
          {visibleTabs.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={{
      position: 'sticky', top: 56, zIndex: 50,
      backgroundColor: C.navBg || C.bg,
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 40px',
        display: 'flex', alignItems: 'stretch',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {visibleTabs.map(t => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onTabClick(t.key)}
              style={{
                flexShrink: 0,
                padding: '0 18px',
                height: 48,
                border: 'none',
                borderBottom: `2px solid ${active ? C.gold : 'transparent'}`,
                backgroundColor: 'transparent',
                color: active ? C.gold : C.textLight,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                transition: 'color 0.15s, border-bottom-color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textLight; }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECTION SIDE IMAGE ──────────────────────────────────────────────────────
// Consistent 3:4 portrait block — same size for ALL sections. No layout shift.
function SectionSideImage({ src, alt = '' }) {
  if (!src) return null;
  return (
    <div style={{ width: 240, flexShrink: 0 }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          display: 'block',
          width: 240,
          aspectRatio: '3/4',
          objectFit: 'cover',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// Wrapper that puts content + side image side by side on desktop
function SectionLayout({ children, sideImg, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      gap: 48,
      alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {!isMobile && <SectionSideImage src={sideImg} />}
    </div>
  );
}

// ─── HERO WRAPPER — style switcher ───────────────────────────────────────────
function Hero({ venue, heroStyle, setHeroStyle, onEnquire }) {
  const C = useT();
  // Only show Video option if the venue has video configured
  const styles = [
    { key: "cinematic", label: "Cinematic" },
    { key: "split",     label: "Split" },
    { key: "magazine",  label: "Magazine" },
    ...(venue.video?.type ? [{ key: "video", label: "▶ Video" }] : []),
  ];
  return (
    <div>
      {heroStyle === "cinematic" && <HeroCinematic venue={venue} onEnquire={onEnquire} />}
      {heroStyle === "split"     && <HeroSplit venue={venue} onEnquire={onEnquire} />}
      {heroStyle === "magazine"  && <HeroMagazine venue={venue} onEnquire={onEnquire} />}
      {heroStyle === "video"     && <HeroVideo venue={venue} onEnquire={onEnquire} />}
      {/* Style picker — admin/preview tool (vendor backend will replace this) */}
      <div style={{
        position: "fixed", bottom: 80, right: 16, zIndex: 800,
        background: C.surface, border: `1px solid ${C.border}`,
        boxShadow: C.shadowMd, padding: "10px 12px",
      }}>
        <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>Hero style</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {styles.map(s => (
            <button key={s.key} onClick={() => setHeroStyle(s.key)} style={{
              padding: "5px 10px", border: `1px solid ${heroStyle === s.key ? C.gold : C.border}`,
              borderRadius: "var(--lwd-radius-input)",
              background: heroStyle === s.key ? C.goldLight : "none",
              color: heroStyle === s.key ? C.gold : C.textLight,
              fontFamily: FB, fontSize: 11, cursor: "pointer", textAlign: "left",
            }}>{s.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STATS STRIP ─────────────────────────────────────────────────────────────
function StatsStrip({ venue }) {
  const C = useT();
  const stats = [
    { label: "From", value: venue.priceFrom, sub: "per event" },
    { label: "Ceremony", value: `Up to ${venue.capacity.ceremony}`, sub: "guests" },
    { label: "Dinner", value: `Up to ${venue.capacity.dinner}`, sub: "guests" },
    { label: "Sleeps", value: venue.accommodation?.maxOvernightGuests ?? venue.accommodation?.maxGuests, sub: `${venue.accommodation?.totalRooms ?? venue.accommodation?.rooms ?? ''} rooms` },
    { label: "Responds", value: venue.responseTime, sub: `${venue.responseRate}% response rate` },
    { label: "Rating", value: `${venue.rating} ★`, sub: `${venue.reviews} reviews` },
  ];
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 40px" }}>
      <div style={{ display: "flex", overflowX: "auto", gap: 0 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            flex: "0 0 auto", padding: "20px 28px",
            borderRight: i < stats.length - 1 ? `1px solid ${C.border}` : "none",
            minWidth: 130,
          }}>
            <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 500, color: C.gold, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, marginTop: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textLight, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIDEBAR: OWNER CARD ─────────────────────────────────────────────────────
function OwnerCard({ owner, venue }) {
  const C = useT();
  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.surface,
      overflow: "hidden",
      marginBottom: 0,
    }}>
      {/* Gold top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />

      <div style={{ padding: "20px 22px" }}>
        {/* Owner header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={owner.photo}
              alt={owner.name}
              style={{
                width: 58, height: 58, borderRadius: "50%", objectFit: "cover",
                border: `2px solid ${C.gold}`, display: "block",
              }}
            />
            {/* LWD verified dot */}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 17, height: 17, borderRadius: "50%",
              background: C.gold, border: `2px solid ${C.surface}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "#fff", fontWeight: 700,
            }}>✓</div>
          </div>
          <div>
            <div style={{ fontFamily: FD, fontSize: 16, color: C.text, lineHeight: 1.2, marginBottom: 2 }}>{owner.name}</div>
            <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight, marginBottom: 1 }}>{owner.title}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.2px" }}>
              ✦ LWD Partner since {owner.memberSince}
            </div>
          </div>
        </div>

        {/* Quote */}
        <div style={{
          borderLeft: `2px solid ${C.goldBorder}`,
          paddingLeft: 14, marginBottom: 16,
        }}>
          <p style={{
            fontFamily: FD, fontSize: 13, fontStyle: "italic",
            color: C.textMid, lineHeight: 1.75, margin: 0,
          }}>"{owner.bio}"</p>
        </div>

        {/* Stats grid */}
        <div className="vp-stats-strip" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 0, borderTop: `1px solid ${C.border}`,
          paddingTop: 14,
        }}>
          {[
            { label: "Responds in",  value: venue.responseTime },
            { label: "Response rate", value: `${venue.responseRate}%` },
            { label: "Weddings held", value: `${venue.weddingsHosted}+` },
            { label: "Partner since", value: `${owner.memberSince}` },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: "10px 0",
              borderRight: i % 2 === 0 ? `1px solid ${C.border}` : "none",
              paddingRight: i % 2 === 0 ? 16 : 0,
              paddingLeft: i % 2 === 1 ? 16 : 0,
            }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: FD, fontSize: 17, color: C.text }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR: MINI CONTACT ───────────────────────────────────────────────────
function SidebarContact({ venue }) {
  const C = useT();
  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface }}>
      {/* Mini map */}
      <div style={{ height: 160, overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <iframe
          title="Mini map"
          width="100%" height="160"
          style={{ display: "block", border: "none", marginTop: -40 }}
          loading="lazy"
          src={`https://maps.google.com/maps?q=${venue.contact.mapQuery}&output=embed&z=11`}
        />
      </div>
      {/* Address + quick actions */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontFamily: FB, fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="pin" size={13} color={C.textMid} /> {venue.contact.addressFormatted}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <a href={`tel:${venue.contact.phone}`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px 8px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
            fontFamily: FB, fontSize: 11, fontWeight: 700, color: C.text,
            textDecoration: "none", letterSpacing: "0.4px", textTransform: "uppercase",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text; }}
          ><Icon name="phone" size={12} /> Call</a>
          <a href={`https://${venue.contact.website}`} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px 8px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
            fontFamily: FB, fontSize: 11, fontWeight: 700, color: C.text,
            textDecoration: "none", letterSpacing: "0.4px", textTransform: "uppercase",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text; }}
          ><Icon name="globe" size={12} /> Website</a>
        </div>
      </div>
    </div>
  );
}

// ─── NOTICE ENQUIRY MODAL ─────────────────────────────────────────────────────
const NOTICE_FORM_CONFIG = {
  "open-day": {
    heading: "Reserve Your Place",
    getContext: (n) => n.title,
    fields: [
      { key: "name",    label: "Full name",        type: "text",     required: true  },
      { key: "email",   label: "Email address",    type: "email",    required: true  },
      { key: "phone",   label: "Phone number",     type: "tel",      required: false },
      { key: "guests",  label: "Number attending", type: "select",   required: true,
        options: ["1 person", "2 people", "3 people", "4 people"] },
      { key: "message", label: "Any questions",    type: "textarea", required: false },
    ],
    submitLabel: "Reserve My Place",
    confirmHeading: "You're reserved.",
    confirmDetail: "We'll send confirmation to your email and look forward to welcoming you.",
  },
  "offer": {
    heading: "Enquire About This Offer",
    getContext: (n) => n.title,
    fields: [
      { key: "name",        label: "Full name",    type: "text",     required: true  },
      { key: "email",       label: "Email address",type: "email",    required: true  },
      { key: "phone",       label: "Phone number", type: "tel",      required: false },
      { key: "weddingDate", label: "Wedding date", type: "text",     required: false, placeholder: "e.g. September 2026" },
      { key: "guests",      label: "Guest count",  type: "text",     required: false, placeholder: "e.g. 120 guests" },
      { key: "message",     label: "Message",      type: "textarea", required: false },
    ],
    submitLabel: "Send Enquiry",
    confirmHeading: "Enquiry received.",
    confirmDetail: "Our team will be in touch within 2 hours to discuss your 2026 booking.",
  },
  "availability": {
    heading: "Enquire About This Date",
    getContext: (n) => `${n.title} — exclusive use`,
    fields: [
      { key: "name",  label: "Full name",    type: "text",  required: true  },
      { key: "email", label: "Email address",type: "email", required: true  },
      { key: "phone", label: "Phone number", type: "tel",   required: true  },
      { key: "guests",label: "Guest count",  type: "text",  required: false, placeholder: "e.g. 80 guests" },
    ],
    note: "We respond within 2 hours. This date will not be held without a confirmed enquiry.",
    submitLabel: "Enquire About This Date",
    confirmHeading: "We're on it.",
    confirmDetail: "Our availability team will contact you within 2 hours. Please keep your phone nearby.",
  },
  "news": {
    heading: "Request Sample Menus",
    getContext: () => "Curated by Lorenzo Conti, Executive Chef",
    fields: [
      { key: "name",       label: "Full name",            type: "text",     required: true  },
      { key: "email",      label: "Email address",        type: "email",    required: true  },
      { key: "weddingDate",label: "Wedding date",         type: "text",     required: false, placeholder: "e.g. June 2026" },
      { key: "dietary",    label: "Dietary requirements", type: "textarea", required: false, placeholder: "Any allergies or preferences to note" },
    ],
    submitLabel: "Request Menus",
    confirmHeading: "Sample menus on their way.",
    confirmDetail: "Lorenzo's current seasonal menu will be sent to your inbox shortly.",
  },
};

function NoticeEnquiryModal({ notice, venueName, onClose }) {
  const C = useT();
  const cfg      = NOTICE_FORM_CONFIG[notice.type] || NOTICE_FORM_CONFIG["offer"];
  const noticeCfg = NOTICE_CONFIG[notice.type]    || NOTICE_CONFIG["news"];
  const [formData,   setFormData]   = useState({});
  const [sent,       setSent]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSent(true); setSubmitting(false); }, 900);
  };

  const inputBase = {
    width: "100%", background: C.bgAlt, border: `1px solid ${C.border}`,
    color: C.text, fontFamily: FB, fontSize: 13, padding: "10px 12px",
    borderRadius: "var(--lwd-radius-input)", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(92vw, 480px)",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderTop: `3px solid ${noticeCfg.accent}`,
          maxHeight: "90vh", overflowY: "auto",
          animation: "lwd-modal-in 0.25s ease",
        }}
      >
        {/* ── Image header ── */}
        {notice.img && (
          <div style={{ position: "relative", height: 170, overflow: "hidden", flexShrink: 0 }}>
            <img src={notice.img} alt={notice.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)",
            }} />
            {/* Type badge */}
            <div style={{
              position: "absolute", top: 14, left: 18,
              fontSize: 9, fontFamily: FB, fontWeight: 700,
              letterSpacing: "1.4px", textTransform: "uppercase",
              color: noticeCfg.accent, borderLeft: `2px solid ${noticeCfg.accent}`, paddingLeft: 7,
            }}>{noticeCfg.label}</div>
            {/* Close */}
            <button onClick={onClose} style={{
              position: "absolute", top: 12, right: 14,
              background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "var(--lwd-radius-input)", color: "rgba(255,255,255,0.8)",
              width: 30, height: 30, cursor: "pointer",
              fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
            {/* Context line */}
            <div style={{
              position: "absolute", bottom: 14, left: 18, right: 50,
              fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.72)",
              fontStyle: "italic", letterSpacing: "0.3px",
            }}>{cfg.getContext(notice)}</div>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding: "26px 26px 30px" }}>
          {!sent ? (
            <>
              <h3 style={{
                fontFamily: FD, fontSize: 21, fontWeight: 400,
                color: C.text, margin: "0 0 5px", lineHeight: 1.2,
              }}>{cfg.heading}</h3>
              <p style={{
                fontFamily: FB, fontSize: 11, color: C.textMuted,
                letterSpacing: "0.3px", margin: "0 0 22px",
              }}>{venueName} · {cfg.getContext(notice)}</p>

              {/* Urgency note (availability only) */}
              {cfg.note && (
                <div style={{
                  background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.22)",
                  borderRadius: "var(--lwd-radius-card)", padding: "10px 13px", marginBottom: 20,
                  fontFamily: FB, fontSize: 11, color: C.textLight, lineHeight: 1.55,
                }}>{cfg.note}</div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {cfg.fields.map(f => (
                  <div key={f.key}>
                    <label style={{
                      display: "block", fontFamily: FB, fontSize: 10, fontWeight: 700,
                      letterSpacing: "1.2px", textTransform: "uppercase",
                      color: C.textMuted, marginBottom: 6,
                    }}>
                      {f.label}
                      {f.required && <span style={{ color: noticeCfg.accent, marginLeft: 3 }}>*</span>}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea rows={3} required={f.required} placeholder={f.placeholder || ""}
                        value={formData[f.key] || ""}
                        onChange={e => handleChange(f.key, e.target.value)}
                        style={{ ...inputBase, resize: "vertical", minHeight: 76 }}
                        onFocus={e => e.target.style.borderColor = noticeCfg.accent}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      />
                    ) : f.type === "select" ? (
                      <select required={f.required} value={formData[f.key] || ""}
                        onChange={e => handleChange(f.key, e.target.value)}
                        style={inputBase}
                        onFocus={e => e.target.style.borderColor = noticeCfg.accent}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      >
                        <option value="">Select…</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} required={f.required}
                        placeholder={f.placeholder || ""}
                        value={formData[f.key] || ""}
                        onChange={e => handleChange(f.key, e.target.value)}
                        style={inputBase}
                        onFocus={e => e.target.style.borderColor = noticeCfg.accent}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      />
                    )}
                  </div>
                ))}

                <button type="submit" disabled={submitting} style={{
                  marginTop: 4,
                  background: noticeCfg.accent, border: "none", borderRadius: "var(--lwd-radius-input)",
                  color: "#0f0d0a", padding: "13px 24px",
                  fontFamily: FB, fontSize: 11, fontWeight: 700,
                  letterSpacing: "1.2px", textTransform: "uppercase",
                  cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.7 : 1, transition: "opacity 0.2s", width: "100%",
                }}>{submitting ? "Sending…" : `${cfg.submitLabel} →`}</button>
              </form>
            </>
          ) : (
            /* ── Confirmation ── */
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                border: `2px solid ${noticeCfg.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 24, color: noticeCfg.accent,
              }}>✓</div>
              <h3 style={{
                fontFamily: FD, fontSize: 22, fontWeight: 400,
                color: C.text, margin: "0 0 10px",
              }}>{cfg.confirmHeading}</h3>
              <p style={{
                fontFamily: FB, fontSize: 13, color: C.textLight,
                lineHeight: 1.65, margin: "0 auto 26px", maxWidth: 300,
              }}>{cfg.confirmDetail}</p>
              <button onClick={onClose} style={{
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-input)", color: C.textMuted,
                padding: "10px 28px", fontFamily: FB, fontSize: 10,
                fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                cursor: "pointer",
              }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR: VENUE NOTICES ───────────────────────────────────────────────────
const NOTICE_CONFIG = {
  "open-day":     { label: "Open Day",         accent: "#C9A84C",              bg: "rgba(201,168,76,0.07)",  icon: "🗓" },
  "offer":        { label: "Special Offer",     accent: "#d97706",              bg: "rgba(217,119,6,0.07)",   icon: "🏷" },
  "availability": { label: "Late Availability", accent: "#22c55e",              bg: "rgba(34,197,94,0.07)",   icon: "📅" },
  "news":         { label: "Estate News",        accent: "#C9A84C",              bg: "rgba(201,168,76,0.07)",  icon: "📢" },
};

function SidebarNotices({ notices, venueName }) {
  const C = useT();
  // Only first notice open by default
  const [openIds,       setOpenIds]       = useState(() => new Set(notices?.length ? [notices[0].id] : []));
  const [enquiryNotice, setEnquiryNotice] = useState(null);
  if (!notices?.length) return null;

  const toggle = (id) => setOpenIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.surface,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px 12px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 10, color: C.gold }}>✦</span>
        <span style={{
          fontFamily: FB, fontSize: 10, fontWeight: 700,
          letterSpacing: "2px", textTransform: "uppercase", color: C.textMuted,
        }}>From {venueName}</span>
      </div>

      {/* Notices */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {notices.map((n, idx) => {
          const cfg = NOTICE_CONFIG[n.type] || NOTICE_CONFIG["news"];
          const isOpen = openIds.has(n.id);
          return (
            <div
              key={n.id}
              style={{
                borderBottom: idx < notices.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              {/* Notice row */}
              <button
                onClick={() => toggle(n.id)}
                style={{
                  width: "100%", textAlign: "left", background: "none", border: "none",
                  padding: "14px 18px", cursor: "pointer", display: "flex",
                  alignItems: "flex-start", gap: 12, transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = cfg.bg}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {/* Type badge */}
                <span style={{
                  flexShrink: 0, marginTop: 1,
                  fontSize: 9, fontFamily: FB, fontWeight: 700,
                  letterSpacing: "1.2px", textTransform: "uppercase",
                  color: cfg.accent, whiteSpace: "nowrap",
                  borderLeft: `2px solid ${cfg.accent}`,
                  paddingLeft: 6,
                }}>
                  {cfg.label}
                </span>

                {/* Title + chevron */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: FB, fontSize: 12, fontWeight: 600,
                    color: C.text, lineHeight: 1.35,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{n.title}</div>
                  {n.expires && (
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                      Expires {n.expires}
                    </div>
                  )}
                </div>

                <span style={{
                  flexShrink: 0, fontSize: 10, color: C.textMuted,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s", lineHeight: 1, marginTop: 2,
                }}>▾</span>
              </button>

              {/* Expanded detail */}
              <div style={{
                overflow: "hidden",
                maxHeight: isOpen ? 420 : 0,
                transition: "max-height 0.4s ease",
              }}>
                <div style={{
                  borderTop: `1px solid ${C.border}`,
                }}>
                  {/* Image — only for news type */}
                  {n.img && (
                    <div style={{ position: "relative", overflow: "hidden" }}>
                      <img
                        src={n.img}
                        alt={n.imgCaption || n.title}
                        style={{ width: "100%", display: "block", maxHeight: 160, objectFit: "cover" }}
                      />
                      {n.imgCaption && (
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          padding: "16px 12px 8px",
                          background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                          fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.75)",
                          fontStyle: "italic", letterSpacing: "0.3px",
                        }}>{n.imgCaption}</div>
                      )}
                    </div>
                  )}
                  <div style={{ padding: "12px 18px 16px" }}>
                  {n.type === "news" && (
                    <p style={{
                      fontFamily: FD, fontSize: 15, fontWeight: 600,
                      color: C.text, lineHeight: 1.35, margin: "0 0 8px",
                    }}>{n.title}</p>
                  )}
                  <p style={{
                    fontFamily: FB, fontSize: 12, color: C.textLight,
                    lineHeight: 1.65, margin: "0 0 12px",
                  }}>{n.detail}</p>
                  <button
                    onClick={e => { e.stopPropagation(); setEnquiryNotice(n); }}
                    style={{
                      background: cfg.accent, border: "none", borderRadius: "var(--lwd-radius-input)",
                      color: "#0f0d0a",
                      padding: "8px 16px", fontFamily: FB, fontSize: 10,
                      fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                      cursor: "pointer", transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >{n.cta} →</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice enquiry modal */}
      {enquiryNotice && (
        <NoticeEnquiryModal
          notice={enquiryNotice}
          venueName={venueName}
          onClose={() => setEnquiryNotice(null)}
        />
      )}
    </div>
  );
}

// ─── SIDEBAR: INSTAGRAM TEASER ───────────────────────────────────────────────
function SidebarInstagram({ venue }) {
  const C = useT();
  // Placeholder tiles — real impl pulls from Instagram Basic Display API
  const posts = [
    { id: 0, src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=240&q=75" },
    { id: 1, src: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=240&q=75" },
    { id: 2, src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=240&q=75" },
    { id: 3, src: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=240&q=75" },
    { id: 4, src: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=240&q=75" },
    { id: 5, src: "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?w=240&q=75" },
  ];
  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>◈</span>
          <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 700, color: C.text }}>@{venue.contact.website.replace("www.", "").split(".")[0]}</span>
        </div>
        <a href="#" style={{ fontFamily: FB, fontSize: 11, color: C.gold, textDecoration: "none", fontWeight: 600 }}>Follow →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
        {posts.map(p => (
          <div key={p.id} style={{ overflow: "hidden", aspectRatio: "1", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.06)"}
            onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}
          >
            <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LEAD FORM (SIDEBAR) ──────────────────────────────────────────────────────
function LeadForm({ venue }) {
  const C = useT();
  const [step, setStep] = useState(0); // 0=idle, 1=date, 2=guests, 3=details, 4=done
  const [form, setForm] = useState({ date: "", guests: 80, name: "", email: "", message: "" });

  const steps = [
    {
      key: "date", label: "When is your wedding?",
      content: (
        <div>
          <label style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Wedding date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt || C.bg, color: C.text, fontFamily: FB, fontSize: 14, outline: "none" }} />
        </div>
      )
    },
    {
      key: "guests", label: "How many guests?",
      content: (
        <div>
          <label style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Guests — <span style={{ color: C.gold, fontWeight: 700 }}>{form.guests}</span>
          </label>
          <input type="range" min={20} max={200} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: +e.target.value }))}
            style={{ width: "100%", accentColor: C.gold }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FB, fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            <span>20</span><span>200</span>
          </div>
        </div>
      )
    },
    {
      key: "details", label: "Your details",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ key: "name", ph: "Your name", type: "text" }, { key: "email", ph: "Email address", type: "email" }].map(f => (
            <input key={f.key} type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt || C.bg, color: C.text, fontFamily: FB, fontSize: 14, outline: "none" }} />
          ))}
          <textarea placeholder="Anything specific you'd like to know? (optional)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3}
            style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt || C.bg, color: C.text, fontFamily: FB, fontSize: 13, outline: "none", resize: "none" }} />
        </div>
      )
    },
  ];

  const canAdvance = () => {
    if (step === 1) return !!form.date;
    if (step === 3) return !!(form.name && form.email);
    return true;
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      boxShadow: C.shadowLg,
      padding: 28,
    }}>
      {/* Price + rating */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
          <span style={{ fontFamily: FD, fontSize: 29, fontWeight: 700, color: C.gold }}>From {venue.priceFrom}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stars rating={venue.rating} size={12} />
          <span style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: C.text }}>{venue.rating}</span>
          <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>· {venue.reviews} reviews</span>
        </div>
        <div style={{ marginTop: 8, fontFamily: FB, fontSize: 12, color: C.green, fontWeight: 600 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="zap" size={13} color={C.green} /> Responds within {venue.responseTime}</span>
        </div>
      </div>

      <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

      {/* Step progress */}
      {step > 0 && step < 4 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: s <= step ? C.gold : C.border, transition: "background 0.3s" }} />
          ))}
        </div>
      )}

      {/* Step content */}
      {step === 0 && (
        <button onClick={() => setStep(1)} style={{
          width: "100%", padding: "15px 20px",
          background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)", color: "#fff",
          fontFamily: FB, fontSize: 14, fontWeight: 800, letterSpacing: "1.2px",
          textTransform: "uppercase", cursor: "pointer",
          transition: "all 0.2s",
        }}>Begin Your Enquiry →</button>
      )}

      {step > 0 && step < 4 && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 500, color: C.text, marginBottom: 16 }}>{steps[step - 1].label}</div>
          {steps[step - 1].content}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                flex: 1, padding: "11px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", background: "none",
                color: C.textLight, fontFamily: FB, fontSize: 13, cursor: "pointer",
              }}>← Back</button>
            )}
            <button onClick={() => step < 3 ? setStep(s => s + 1) : setStep(4)}
              disabled={!canAdvance()}
              style={{
                flex: 2, padding: "11px",
                background: canAdvance() ? C.gold : C.border,
                border: "none", borderRadius: "var(--lwd-radius-input)",
                color: canAdvance() ? "#fff" : C.textMuted,
                fontFamily: FB, fontSize: 13, fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed",
                letterSpacing: "0.5px", transition: "all 0.2s",
              }}>{step < 3 ? "Continue →" : "Send Enquiry →"}</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontFamily: FB, fontSize: 11, color: C.textMuted }}>
            Step {step} of 3
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease", padding: "8px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: FD, fontSize: 20, color: C.text, marginBottom: 8 }}>Enquiry Sent</div>
          <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, lineHeight: 1.6 }}>
            Your message is with Villa Rosanova. They typically reply within {venue.responseTime}.
          </div>
          <button onClick={() => setStep(0)} style={{
            marginTop: 16, padding: "9px 20px",
            border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", background: "none",
            color: C.textLight, fontFamily: FB, fontSize: 12, cursor: "pointer",
          }}>Make another enquiry</button>
        </div>
      )}

      {/* Activity signal */}
      {step < 4 && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: C.goldLight, border: `1px solid ${C.goldBorder}` }}>
          <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, fontWeight: 600 }}>🔥 3 couples enquired this week</div>
        </div>
      )}

      {/* Save + Compare */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {["♡ Save", "⊕ Compare"].map(a => (
          <button key={a} style={{
            flex: 1, padding: "9px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", background: "none",
            color: C.textLight, fontFamily: FB, fontSize: 12, cursor: "pointer",
            transition: "all 0.2s",
          }}>{a}</button>
        ))}
      </div>
    </div>
  );
}

// ─── IMAGE GALLERY — Coco-style 3-photo preview ──────────────────────────────
function ImageGallery({ gallery, onOpenLight }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [allOpen, setAllOpen] = useState(false);
  const scrollRef = useRef(null);
  const preview = gallery.slice(0, 6);
  const remaining = gallery.length - 5;

  return (
    <section id="gallery" style={{ marginBottom: 56 }}>
      <SectionHeading title="Gallery" />

      {/* ── Mobile: horizontal photo slider ── */}
      {isMobile && !allOpen && (
        <div>
          <div ref={scrollRef} className="vp-gallery-slider" style={{
            display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
            marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
          }}>
            {preview.map((img, i) => (
              <div key={img.id} onClick={() => onOpenLight(i)} style={{
                flex: "0 0 280px", scrollSnapAlign: "start",
                overflow: "hidden", cursor: "pointer", position: "relative",
                borderRadius: 3, height: 340,
              }}>
                <img src={img.src} alt={img.alt || ""} loading="lazy" style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                }} />
                {/* Photo number badge */}
                <div style={{
                  position: "absolute", bottom: 10, left: 10,
                  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                  borderRadius: 20, padding: "3px 10px",
                  fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.5px",
                }}>{i + 1} / {gallery.length}</div>
              </div>
            ))}
            {/* "View all" final card */}
            <div onClick={() => setAllOpen(true)} style={{
              flex: "0 0 180px", scrollSnapAlign: "start",
              borderRadius: 3, height: 340, cursor: "pointer",
              background: C.surface, border: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <div style={{ fontFamily: FD, fontSize: 36, color: C.gold, fontWeight: 400, lineHeight: 1 }}>+{remaining}</div>
              <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>View all</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop: grid preview ── */}
      {!isMobile && !allOpen && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: 6 }}>
            <div onClick={() => onOpenLight(0)} style={{
              gridRow: "1 / 3", overflow: "hidden", cursor: "pointer",
              position: "relative", minHeight: 360,
            }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[0]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
            </div>
            <div onClick={() => onOpenLight(1)} style={{ overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "4/3" }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[1]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
            </div>
            <div onClick={() => setAllOpen(true)} style={{ overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "4/3" }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[2]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6,
              }}>
                <span style={{ fontFamily: FD, fontSize: 32, color: "#fff", fontWeight: 400 }}>+{gallery.length - 3}</span>
                <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.85)", letterSpacing: "1px", textTransform: "uppercase" }}>View all photos</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => setAllOpen(true)} style={{
              background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
              color: C.textLight, fontFamily: FB, fontSize: 12, fontWeight: 600,
              padding: "8px 18px", cursor: "pointer", letterSpacing: "0.3px",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textLight; }}>
              View all {gallery.length} photographs →
            </button>
          </div>
        </div>
      )}

      {/* ── Full gallery — masonry ── */}
      {allOpen && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ columns: isMobile ? 2 : 3, columnGap: 6, marginBottom: 16 }}>
            {gallery.map((img, i) => (
              <div key={img.id} onClick={() => onOpenLight(i)} style={{
                breakInside: "avoid", marginBottom: 6, overflow: "hidden", cursor: "pointer",
                borderRadius: 2,
              }}
                onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
                <img src={img.src} alt="" loading="lazy" style={{ width: "100%", display: "block", transition: "transform 0.7s ease" }} />
              </div>
            ))}
          </div>
          <button onClick={() => setAllOpen(false)} style={{
            background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
            color: C.textLight, fontFamily: FB, fontSize: 12,
            padding: "8px 18px", cursor: "pointer",
          }}>← Show less</button>
        </div>
      )}
    </section>
  );
}

// ─── LIGHTBOX ────────────────────────────────────────────────────────────────
function Lightbox({ gallery, idx, onClose, onPrev, onNext, setLightIdx, engagement }) {
  const isMobile = useIsMobile();
  const [autoPlay, setAutoPlay] = useState(false);
  const [hovPrev, setHovPrev]   = useState(false);
  const [hovNext, setHovNext]   = useState(false);
  const [viewAll, setViewAll]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const thumbRef = useRef(null);

  const photo = gallery[idx];
  const pg = photo?.photographer;
  const eng = engagement?.[photo?.id] || { likes: 0, comments: [] };
  const isLiked = likedMap[photo?.id] || false;
  const likeCount = eng.likes + (isLiked ? 1 : 0);
  const allComments = [...(eng.comments || []), ...(commentsMap[photo?.id] || [])];

  // Keyboard nav
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") { if (viewAll) setViewAll(false); else onClose(); }
      if (e.key === "ArrowLeft" && !viewAll) onPrev();
      if (e.key === "ArrowRight" && !viewAll) onNext();
      if (e.key === " ") { e.preventDefault(); setAutoPlay((a) => !a); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext, viewAll]);

  // Auto-play slideshow
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => onNext(), 3000);
    return () => clearInterval(timer);
  }, [autoPlay, onNext]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbRef.current) {
      const active = thumbRef.current.children[idx];
      if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [idx]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href + `#photo-${photo.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Share via email
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Villa Rosanova — Photo ${idx + 1}`);
    const body = encodeURIComponent(`Check out this photo from Villa Rosanova:\n${photo.alt || ""}\n\nPhotographer: ${pg?.name || "Unknown"}\n${window.location.href}#photo-${photo.id}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Share via Pinterest
  const handlePinterestShare = () => {
    const url = encodeURIComponent(window.location.href);
    const media = encodeURIComponent(photo.src);
    const desc = encodeURIComponent(`${photo.alt || "Villa Rosanova"} — Photo by ${pg?.name || ""}`);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, "_blank", "width=600,height=400");
  };

  // Share via Facebook
  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href + `#photo-${photo.id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  };

  // Share via Instagram (copy link + open Instagram)
  const handleInstagramShare = () => {
    navigator.clipboard.writeText(`${photo.alt || "Villa Rosanova"} — Photo by ${pg?.name || ""}\n${window.location.href}#photo-${photo.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open("https://www.instagram.com/", "_blank");
    });
  };

  if (idx === null) return null;

  const navBtn = (dir, hov, setHov) => (
    <button
      onClick={(e) => { e.stopPropagation(); dir === "prev" ? onPrev() : onNext(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={dir === "prev" ? "Previous photo" : "Next photo"}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: 16,
        width: 44, height: 44, borderRadius: "50%",
        background: hov ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}`,
        backdropFilter: "blur(4px)",
        color: hov ? "#fff" : "rgba(255,255,255,0.7)",
        cursor: "pointer", fontSize: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", zIndex: 10,
      }}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );

  // Small share button helper
  const shareBtn = (label, icon, onClick, hov) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "7px 0", background: "none",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--lwd-radius-input)",
        color: "rgba(255,255,255,0.5)", fontFamily: FB, fontSize: 10,
        fontWeight: 600, letterSpacing: "0.4px", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span> {label}
    </button>
  );

  // View All grid overlay
  if (viewAll) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(5,4,3,0.97)", zIndex: 2000,
        overflow: "auto", padding: "60px 40px 40px",
      }}>
        {/* Header */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          padding: "16px 40px", background: "rgba(5,4,3,0.92)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: FD, fontSize: 18, color: "#f5f2ec" }}>
            All Photos <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{gallery.length} photographs</span>
          </div>
          <button onClick={() => setViewAll(false)} aria-label="Close grid view"
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
              fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
        {/* Grid */}
        <div style={{ columns: 4, columnGap: 8 }}>
          {gallery.map((img, i) => (
            <div key={img.id} onClick={() => { setViewAll(false); setLightIdx?.(i); }}
              style={{ breakInside: "avoid", marginBottom: 8, cursor: "pointer", position: "relative", overflow: "hidden" }}
            >
              <img src={img.src} alt={img.alt || ""} style={{ width: "100%", display: "block", transition: "transform 0.5s, opacity 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
              />
              {/* Tags overlay on hover */}
              {img.tags && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "24px 8px 6px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  display: "flex", flexWrap: "wrap", gap: 3, opacity: 0, transition: "opacity 0.3s",
                }}
                  className="lwd-tag-overlay"
                >
                  {img.tags.slice(0, 3).map(t => (
                    <span key={t} style={{
                      fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.8)",
                      background: "rgba(255,255,255,0.12)", padding: "2px 6px",
                      borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 2000,
      display: "flex", flexDirection: "column",
    }}>
      {/* Top bar */}
      <div onClick={(e) => e.stopPropagation()} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec" }}>
            {idx + 1} <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {gallery.length}</span>
          </span>
          {pg && <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>📷 {pg.name}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Auto-play toggle — hidden on mobile */}
          {!isMobile && (
            <button onClick={() => setAutoPlay((a) => !a)}
              style={{
                background: autoPlay ? "rgba(201,168,76,0.12)" : "none",
                border: `1px solid ${autoPlay ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: "var(--lwd-radius-input)", color: autoPlay ? "#C9A84C" : "rgba(255,255,255,0.5)",
                padding: "6px 14px", cursor: "pointer", fontFamily: FB, fontSize: 11,
                fontWeight: 600, letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s",
              }}
            >
              {autoPlay ? "❚❚" : "▶"} {autoPlay ? "Pause" : "Slideshow"}
            </button>
          )}
          {/* View All — hidden on mobile */}
          {!isMobile && (
            <button onClick={() => setViewAll(true)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--lwd-radius-input)",
                color: "rgba(255,255,255,0.5)", padding: "6px 14px", cursor: "pointer",
                fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              ⊞ View All
            </button>
          )}
          {/* Close */}
          <button onClick={onClose} aria-label="Close gallery"
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
              fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
          >✕</button>
        </div>
      </div>

      {/* Main content: image + info panel */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: 0, overflow: isMobile ? "auto" : "hidden",
      }}>
        {/* Image area */}
        <div onClick={onClose} style={{
          flex: isMobile ? "none" : 1, display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden", minWidth: 0,
          minHeight: isMobile ? "50vh" : undefined,
        }}>
          <img
            key={idx}
            src={photo.src}
            alt={photo.alt || ""}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "100%", maxWidth: "100%", objectFit: "contain",
              animation: "fadeIn 0.3s ease",
            }}
          />
          {/* Nav arrows — on mobile show smaller inline arrows */}
          {isMobile ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            </>
          ) : (
            <>
              {navBtn("prev", hovPrev, setHovPrev)}
              {navBtn("next", hovNext, setHovNext)}
            </>
          )}

          {/* Auto-play progress bar */}
          {autoPlay && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
              background: "rgba(255,255,255,0.08)",
            }}>
              <div style={{
                height: "100%", background: "#C9A84C",
                animation: "lightbox-progress 3s linear infinite",
              }} />
            </div>
          )}
        </div>

        {/* ── Info panel (right on desktop, below on mobile) ── */}
        <div style={{
          width: isMobile ? "100%" : 280, flexShrink: 0,
          borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderTop: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(10,8,6,0.6)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", padding: isMobile ? "16px 16px 40px" : "20px 18px",
        }}>
          {/* Image description */}
          {photo.alt && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Description</div>
              <div style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, fontWeight: 300 }}>{photo.alt}</div>
            </div>
          )}

          {/* Photographer details */}
          {pg && (
            <div style={{
              marginBottom: 20, padding: "14px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--lwd-radius-card)",
            }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Photographer</div>
              <div style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec", marginBottom: 3 }}>{pg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} color="rgba(255,255,255,0.45)" /> {pg.area}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pg.instagram && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="culture" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "#C9A84C" }}>{pg.instagram}</span>
                  </div>
                )}
                {pg.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="globe" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pg.website}</span>
                  </div>
                )}
                {pg.camera && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>📷</span>
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{pg.camera}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags for AI search */}
          {photo.tags && photo.tags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {photo.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "3px 8px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                    transition: "all 0.2s", cursor: "default",
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sharing options */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {shareBtn(copied ? "Copied!" : "Copy", "📋", handleCopyLink)}
              {shareBtn("Pin", "📌", handlePinterestShare)}
              {shareBtn("Email", "✉", handleEmailShare)}
              {shareBtn("Facebook", "📘", handleFacebookShare)}
              {shareBtn("Instagram", "📷", handleInstagramShare)}
            </div>
          </div>

          {/* ── Appreciations & Reflections ── */}
          <div style={{ marginBottom: 20 }}>
            {/* Appreciation + reflection count */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <button onClick={() => setLikedMap(m => ({ ...m, [photo.id]: !m[photo.id] }))}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: isLiked ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isLiked ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "var(--lwd-radius-input)", padding: "6px 12px", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 13, transition: "transform 0.2s", transform: isLiked ? "scale(1.15)" : "scale(1)" }}>{isLiked ? "❤️" : "🤍"}</span>
                <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, color: isLiked ? "#C9A84C" : "rgba(255,255,255,0.45)", letterSpacing: "0.3px" }}>
                  {likeCount} {likeCount === 1 ? "Appreciation" : "Appreciations"}
                </span>
              </button>
              {allComments.length > 0 && (
                <span style={{ fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.3px" }}>
                  {allComments.length} {allComments.length === 1 ? "Reflection" : "Reflections"}
                </span>
              )}
            </div>

            {/* Reflection input */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share Your Reflection</div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your reflection on this moment..."
                style={{
                  width: "100%", minHeight: 52, resize: "vertical",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "var(--lwd-radius-input)", padding: "10px 12px",
                  fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.6, outline: "none", fontStyle: "italic",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.fontStyle = "normal"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; if (!commentText) e.currentTarget.style.fontStyle = "italic"; }}
              />
              {commentText.trim() && (
                <button
                  onClick={() => {
                    if (!commentText.trim()) return;
                    setCommentsMap(m => ({
                      ...m,
                      [photo.id]: [...(m[photo.id] || []), { name: "You", text: commentText.trim(), date: new Date().toISOString().slice(0, 10) }],
                    }));
                    setCommentText("");
                  }}
                  style={{
                    marginTop: 6, width: "100%", padding: "8px 0",
                    background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
                    fontFamily: FB, fontSize: 10, fontWeight: 600,
                    color: "#C9A84C", letterSpacing: "0.8px", textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
                >
                  Share Reflection
                </button>
              )}
            </div>

            {/* Curated Reflections */}
            {allComments.length > 0 && (
              <div>
                <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
                  Curated Reflections
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                  {allComments.map((c, ci) => (
                    <div key={ci} style={{
                      padding: "10px 12px",
                      borderLeft: "2px solid rgba(201,168,76,0.25)",
                      background: "rgba(255,255,255,0.015)",
                    }}>
                      <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontStyle: "italic", fontWeight: 300 }}>
                        "{c.text}"
                      </div>
                      <div style={{ fontFamily: FB, fontSize: 10, color: "rgba(201,168,76,0.5)", marginTop: 6, fontWeight: 600 }}>
                        — {c.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image meta */}
          <div style={{
            marginTop: "auto", paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Image Info</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              Photo {idx + 1} of {gallery.length}<br />
              {pg ? `© ${pg.name}` : "Villa Rosanova"}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 12px", overflow: "hidden",
      }}>
        <div ref={thumbRef} className="lwd-thumb-strip" style={{
          display: "flex", gap: 4, overflowX: "auto",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}>
          {gallery.map((img, i) => (
            <div
              key={img.id}
              onClick={() => setLightIdx?.(i)}
              style={{
                flexShrink: 0, width: 72, height: 48, cursor: "pointer",
                border: i === idx ? "2px solid #C9A84C" : "2px solid transparent",
                opacity: i === idx ? 1 : 0.4,
                transition: "all 0.2s", overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (i !== idx) e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { if (i !== idx) e.currentTarget.style.opacity = "0.4"; }}
            >
              <img src={img.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ABOUT SECTION ────────────────────────────────────────────────────────────
function AboutSection({ venue }) {
  const C = useT();
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  return (
    <section id="overview" style={{ marginBottom: 56 }}>
      <SectionHeading title={`About ${venue.name}`} />

      {/* Single-column editorial layout — no side image, no stats block */}
      <div>

        {/* Intro paragraph */}
        <p style={{ fontFamily: FB, fontSize: isMobile ? 15 : 16, color: C.textMid, lineHeight: 1.9, marginBottom: 28, maxWidth: 780 }}>
          Set within 120 acres of rolling Tuscan countryside, Villa Rosanova is one of the finest privately-owned estates in Italy. Built in 1847 for the Marchese di Rosanova, the property has been meticulously restored to its original grandeur while offering every modern comfort a discerning couple could wish for.
        </p>

        {/* Two landscape images — equal height, side by side */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 6,
          marginBottom: 28,
        }}>
          <img
            src="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80"
            alt="Villa Rosanova interior detail"
            loading="lazy"
            style={{ width: "100%", height: isMobile ? 220 : 300, objectFit: "cover", display: "block", borderRadius: 3 }}
          />
          <img
            src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80"
            alt="Cypress garden at dusk"
            loading="lazy"
            style={{ width: "100%", height: isMobile ? 220 : 300, objectFit: "cover", display: "block", borderRadius: 3 }}
          />
        </div>

        {/* Second paragraph */}
        <p style={{ fontFamily: FB, fontSize: isMobile ? 14 : 15, color: C.textLight, lineHeight: 1.9, marginBottom: 16, maxWidth: 780 }}>
          From the frescoed Grand Salon — with its original parquet floors and three Venetian chandeliers — to the centuries-old cypress garden, every space has been designed to create moments of extraordinary beauty. With accommodation for 58 guests across 24 rooms and 6 suites, Villa Rosanova is the perfect setting for multi-day wedding celebrations.
        </p>

        {/* Expandable paragraphs */}
        <div style={{ overflow: "hidden", maxHeight: expanded ? 500 : 0, transition: "max-height 0.5s ease", maxWidth: 780 }}>
          <p style={{ fontFamily: FB, fontSize: isMobile ? 14 : 15, color: C.textLight, lineHeight: 1.9, marginBottom: 16 }}>
            The estate produces its own Chianti Classico wine, cold-pressed extra virgin olive oil, and seasonal truffles — all of which feature on our exclusively crafted wedding menus. Every detail of your celebration is managed by our dedicated events team, who have hosted over 300 weddings across four decades.
          </p>
          <p style={{ fontFamily: FB, fontSize: isMobile ? 14 : 15, color: C.textLight, lineHeight: 1.9 }}>
            Villa Rosanova has been featured in Vogue, Tatler and Harper's Bazaar, and has received the Luxury Wedding Directory's Best Villa award three years in succession. For couples seeking a truly once-in-a-lifetime setting — where privacy, beauty and impeccable service converge — there is simply nowhere quite like it.
          </p>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 4, marginBottom: 32,
            background: "none", border: "none",
            fontFamily: FB, fontSize: 13, fontWeight: 700,
            color: C.gold, cursor: "pointer", letterSpacing: "0.3px",
            padding: 0,
          }}
        >
          {expanded ? "Show less ↑" : "Read the full story →"}
        </button>

        {/* Awards — horizontal scroll on mobile */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>Awards & Recognition</div>
          <div className="vp-awards-scroll" style={{
            display: "flex", gap: 8, overflowX: isMobile ? "auto" : "visible",
            flexWrap: isMobile ? "nowrap" : "wrap",
            scrollbarWidth: "none", msOverflowStyle: "none",
            paddingBottom: isMobile ? 4 : 0,
          }}>
            {venue.awards.map(a => (
              <div key={a} style={{
                flex: "0 0 auto",
                padding: "8px 14px",
                border: `1px solid ${C.gold}30`,
                background: `${C.gold}08`,
                borderRadius: 3,
                fontFamily: FB, fontSize: 11, fontWeight: 600,
                color: C.gold, letterSpacing: "0.3px", whiteSpace: "nowrap",
              }}>
                ✦ {a}
              </div>
            ))}
          </div>
        </div>

        {/* Press */}
        <div>
          <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>As Seen In</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {venue.press.map(p => (
              <span key={p} style={{
                fontFamily: FD, fontSize: isMobile ? 15 : 17, fontWeight: 400,
                color: C.textLight, letterSpacing: "0.5px",
              }}>{p}</span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── CONTACT SECTION ─────────────────────────────────────────────────────────
function ContactSection({ venue }) {
  const C = useT();
  const [emailRevealed, setEmailRevealed] = useState(false);
  const addr = venue.contact.address;
  const rm = venue.contact.responseMetrics;

  const contactRow = (iconName, label, content, props = {}) => {
    const Tag = props.href ? "a" : "div";
    return (
      <Tag {...(props.href ? { href: props.href, target: props.target, rel: props.rel } : {})}
        style={{
          padding: "18px 20px", display: "flex", gap: 14, alignItems: "center",
          textDecoration: "none", transition: "background 0.2s",
          borderBottom: props.last ? "none" : `1px solid ${C.border}`,
          ...(props.topAlign ? { alignItems: "flex-start" } : {}),
        }}
        onMouseEnter={props.href ? (e => e.currentTarget.style.background = C.bgAlt) : undefined}
        onMouseLeave={props.href ? (e => e.currentTarget.style.background = "transparent") : undefined}
      >
        <Icon name={iconName} size={18} color={C.textMuted} style={props.topAlign ? { marginTop: 2 } : {}} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
          {content}
        </div>
      </Tag>
    );
  };

  const addressFormatted = [addr.line1, addr.city, `${addr.postcode} ${addr.region}`, addr.country].join(", ");

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Contact & Location" />
      <div className="vp-contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

        {/* Contact details */}
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {contactRow("pin", "Address",
              <div style={{ fontFamily: FB, fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>{addressFormatted}</div>,
              { topAlign: true }
            )}
            {contactRow("phone", "Phone",
              <div style={{ fontFamily: FB, fontSize: 15, color: C.gold, fontWeight: 600 }}>{venue.contact.phone}</div>,
              { href: `tel:${venue.contact.phone}` }
            )}
            {contactRow("email", "Email",
              emailRevealed
                ? <a href={`mailto:${venue.contact.email}`} style={{ fontFamily: FB, fontSize: 14, color: C.gold, textDecoration: "none" }}>{venue.contact.email}</a>
                : <button onClick={() => setEmailRevealed(true)} style={{
                    background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
                    color: C.textLight, fontFamily: FB, fontSize: 12, padding: "5px 12px",
                    cursor: "pointer", letterSpacing: "0.3px",
                  }}>Click to reveal email</button>
            )}
            {contactRow("globe", "Website",
              <div style={{ fontFamily: FB, fontSize: 14, color: C.gold, fontWeight: 600 }}>{venue.contact.website}</div>,
              { href: `https://${venue.contact.website}`, target: "_blank", rel: "noopener noreferrer", last: true }
            )}
          </div>

          {/* Response metrics */}
          <div style={{ marginTop: 14, padding: "12px 16px", background: C.goldLight, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Icon name="zap" size={14} color={C.gold} style={{ marginTop: 1 }} />
            <div>
              <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 3 }}>Responds within {rm.averageResponseHours} hrs</div>
              <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight }}>
                {rm.responseRatePercent}% response rate{rm.sameDayTypical ? " . Typically replies same day" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div style={{ border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <iframe
            title="Venue location"
            width="100%"
            height="100%"
            style={{ display: "block", minHeight: 300, border: "none" }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${venue.contact.mapQuery}&output=embed&z=12`}
          />
        </div>
      </div>
    </section>
  );
}

// ─── VIDEO PLAY MODAL ─────────────────────────────────────────────────────────
function VideoPlayModal({ video, videos = [], onSelect, onClose, engagement }) {
  const isMobile = useIsMobile();
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [likedMap, setLikedMap]       = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const [ytPaused, setYtPaused]       = useState(false);

  const idx = videos.findIndex((v) => v.id === video.id);
  const hasPrev = idx > 0;
  const hasNext = idx < videos.length - 1;
  const vg = video.videographer;
  const eng = engagement?.[video.id] || { likes: 0, comments: [] };
  const isLiked = likedMap[video.id] || false;
  const likeCount = eng.likes + (isLiked ? 1 : 0);
  const allComments = [...(eng.comments || []), ...(commentsMap[video.id] || [])];

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = video.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&controls=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`
    : null;

  const iframeRef = useRef(null);

  // Reset paused overlay when video changes
  useEffect(() => { setYtPaused(false); }, [video.id]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onSelect?.(videos[idx - 1]);
      if (e.key === "ArrowRight" && hasNext) onSelect?.(videos[idx + 1]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, hasPrev, hasNext, idx, videos, onSelect]);

  // Listen for YouTube video end → auto-play next
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !video.youtubeId) return;

    // Tell YouTube we're listening for events
    const onLoad = () => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: "listening" }), "*");
        iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
      } catch (_) {}
    };
    iframe.addEventListener("load", onLoad);

    // Listen for state change messages from YouTube
    const onMessage = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "onStateChange") {
          // YouTube state: 0=ended, 1=playing, 2=paused
          if (data.info === 0 && hasNext) {
            onSelect?.(videos[idx + 1]);
          }
          setYtPaused(data.info === 2 || data.info === 0);
          if (data.info === 1) setYtPaused(false);
        }
      } catch (_) {}
    };
    window.addEventListener("message", onMessage);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
    };
  }, [video.youtubeId, hasNext, idx, videos, onSelect]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href + `#film-${video.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Villa Rosanova — ${video.title}`);
    const body = encodeURIComponent(`Check out this film from Villa Rosanova:\n${video.title}\n\nFilmed by: ${vg?.name || "Unknown"}\n${window.location.href}#film-${video.id}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Share via Facebook
  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href + `#film-${video.id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  };

  // Share via Instagram (copy link + open Instagram)
  const handleInstagramShare = () => {
    navigator.clipboard.writeText(`${video.title} — Filmed by ${vg?.name || ""}\n${window.location.href}#film-${video.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open("https://www.instagram.com/", "_blank");
    });
  };

  // Share via Pinterest
  const handlePinterestShare = () => {
    const url = encodeURIComponent(window.location.href + `#film-${video.id}`);
    const media = encodeURIComponent(video.thumb);
    const desc = encodeURIComponent(`${video.title} — Filmed by ${vg?.name || ""} at Villa Rosanova`);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, "_blank", "width=600,height=400");
  };

  const navBtn = (dir, enabled, hov, setHov) => (
    <button
      onClick={() => enabled && onSelect?.(videos[dir === "prev" ? idx - 1 : idx + 1])}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={dir === "prev" ? "Previous video" : "Next video"}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: -52,
        width: 40, height: 40, borderRadius: "50%",
        background: hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}`,
        color: enabled ? (hov ? "#fff" : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.15)",
        cursor: enabled ? "pointer" : "default",
        fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );

  const shareBtn = (label, icon, onClick) => (
    <button onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "7px 0", background: "none",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--lwd-radius-input)",
        color: "rgba(255,255,255,0.5)", fontFamily: FB, fontSize: 10,
        fontWeight: 600, letterSpacing: "0.4px", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span> {label}
    </button>
  );

  return (
    <div
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label={`Play ${video.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(0,0,0,0.96)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div onClick={(e) => e.stopPropagation()} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec" }}>
            {idx + 1} <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {videos.length}</span>
          </span>
          {vg && <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>🎬 {vg.name}</span>}
        </div>
        <button onClick={onClose} aria-label="Close video"
          style={{
            background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
            color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
            fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >✕</button>
      </div>

      {/* Main content: video + info panel */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: 0, overflow: isMobile ? "auto" : "hidden",
      }}>
        {/* Video area */}
        <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
          {/* Prev / Next arrows — hidden on mobile */}
          {!isMobile && videos.length > 1 && navBtn("prev", hasPrev, hovPrev, setHovPrev)}
          {!isMobile && videos.length > 1 && navBtn("next", hasNext, hovNext, setHovNext)}

          {/* Video player */}
          {embedUrl ? (
            <div style={{
              flex: isMobile ? "none" : 1,
              position: "relative",
              background: "#000",
              ...(isMobile ? { width: "100%", aspectRatio: "16/9" } : {}),
            }}>
              <iframe
                ref={iframeRef}
                key={video.youtubeId + video.id}
                src={embedUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
              {/* Overlay to block YouTube "More videos" suggestions when paused */}
              {ytPaused && (
                <div
                  onClick={() => {
                    // Resume playback via YouTube postMessage API
                    try {
                      iframeRef.current?.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
                      setYtPaused(false);
                    } catch (_) {}
                  }}
                  style={{
                    position: "absolute", bottom: 52, left: 0, right: 0,
                    height: "calc(100% - 100px)", zIndex: 2,
                    background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 40%, transparent 100%)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                    paddingBottom: 40, cursor: "pointer",
                    transition: "opacity 0.3s",
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                    marginBottom: 12, transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 20, color: "#fff", marginLeft: 3 }}>▶</span>
                  </div>
                  <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", textTransform: "uppercase" }}>Click to resume</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              flex: isMobile ? "none" : 1,
              position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
              ...(isMobile ? { width: "100%", aspectRatio: "16/9" } : {}),
            }}>
              <img src={video.thumb} alt={video.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.2 }} />
              <div style={{ position: "relative", textAlign: "center", padding: 32 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
                  border: "1px solid rgba(201,168,76,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(201,168,76,0.08)",
                }}>
                  <span style={{ fontSize: 18, color: "#C9A84C", marginLeft: 3 }}>▶</span>
                </div>
                <div style={{ fontFamily: FD, fontSize: 15, color: "rgba(201,168,76,0.85)", letterSpacing: "1.5px" }}>Film Coming Soon</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 300, lineHeight: 1.65, marginTop: 8 }}>
                  This film will be available shortly.<br />Contact us for a private screening enquiry.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Info panel (right on desktop, below on mobile) ── */}
        <div style={{
          width: isMobile ? "100%" : 280, flexShrink: 0,
          borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderTop: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(10,8,6,0.6)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", padding: isMobile ? "16px 16px 40px" : "20px 18px",
        }}>
          {/* Title + type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FD, fontSize: isMobile ? 19 : 17, color: "#f5f2ec", lineHeight: 1.3, marginBottom: 4 }}>{video.title}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {video.duration} · {video.type === "wedding" ? "Wedding Film" : video.type === "tour" ? "Estate Tour" : "Highlights"}
            </div>
          </div>

          {/* Description */}
          {video.desc && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>About This Film</div>
              <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, fontWeight: 300 }}>{video.desc}</div>
            </div>
          )}

          {/* Videographer details */}
          {vg && (
            <div style={{
              marginBottom: 18, padding: "14px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--lwd-radius-card)",
            }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Videographer</div>
              <div style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec", marginBottom: 3 }}>{vg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} color="rgba(255,255,255,0.45)" /> {vg.area}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {vg.instagram && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="culture" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "#C9A84C" }}>{vg.instagram}</span>
                  </div>
                )}
                {vg.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="globe" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{vg.website}</span>
                  </div>
                )}
                {vg.camera && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>🎥</span>
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{vg.camera}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {video.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "3px 8px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sharing */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {shareBtn(copied ? "Copied!" : "Copy", "📋", handleCopyLink)}
              {shareBtn("Pin", "📌", handlePinterestShare)}
              {shareBtn("Email", "✉", handleEmailShare)}
              {shareBtn("Facebook", "📘", handleFacebookShare)}
              {shareBtn("Instagram", "📷", handleInstagramShare)}
            </div>
          </div>

          {/* ── Appreciations & Reflections ── */}
          <div style={{ marginBottom: 18 }}>
            {/* Appreciation + reflection count */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <button onClick={() => setLikedMap(m => ({ ...m, [video.id]: !m[video.id] }))}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: isLiked ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isLiked ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "var(--lwd-radius-input)", padding: "6px 12px", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 13, transition: "transform 0.2s", transform: isLiked ? "scale(1.15)" : "scale(1)" }}>{isLiked ? "❤️" : "🤍"}</span>
                <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, color: isLiked ? "#C9A84C" : "rgba(255,255,255,0.45)", letterSpacing: "0.3px" }}>
                  {likeCount} {likeCount === 1 ? "Appreciation" : "Appreciations"}
                </span>
              </button>
              {allComments.length > 0 && (
                <span style={{ fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.3px" }}>
                  {allComments.length} {allComments.length === 1 ? "Reflection" : "Reflections"}
                </span>
              )}
            </div>

            {/* Reflection input */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share Your Reflection</div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your reflection on this film..."
                style={{
                  width: "100%", minHeight: 52, resize: "vertical",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "var(--lwd-radius-input)", padding: "10px 12px",
                  fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.6, outline: "none", fontStyle: "italic",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.fontStyle = "normal"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; if (!commentText) e.currentTarget.style.fontStyle = "italic"; }}
              />
              {commentText.trim() && (
                <button
                  onClick={() => {
                    if (!commentText.trim()) return;
                    setCommentsMap(m => ({
                      ...m,
                      [video.id]: [...(m[video.id] || []), { name: "You", text: commentText.trim(), date: new Date().toISOString().slice(0, 10) }],
                    }));
                    setCommentText("");
                  }}
                  style={{
                    marginTop: 6, width: "100%", padding: "8px 0",
                    background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
                    fontFamily: FB, fontSize: 10, fontWeight: 600,
                    color: "#C9A84C", letterSpacing: "0.8px", textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
                >
                  Share Reflection
                </button>
              )}
            </div>

            {/* Curated Reflections */}
            {allComments.length > 0 && (
              <div>
                <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
                  Curated Reflections
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                  {allComments.map((c, ci) => (
                    <div key={ci} style={{
                      padding: "10px 12px",
                      borderLeft: "2px solid rgba(201,168,76,0.25)",
                      background: "rgba(255,255,255,0.015)",
                    }}>
                      <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontStyle: "italic", fontWeight: 300 }}>
                        "{c.text}"
                      </div>
                      <div style={{ fontFamily: FB, fontSize: 10, color: "rgba(201,168,76,0.5)", marginTop: 6, fontWeight: 600 }}>
                        — {c.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Film meta */}
          <div style={{
            marginTop: "auto", paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Film Info</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              Film {idx + 1} of {videos.length}<br />
              {vg ? `© ${vg.name}` : "Villa Rosanova"}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: isMobile ? "8px 8px" : "8px 12px", overflow: "hidden",
      }}>
        <div style={{ display: "flex", gap: 6, justifyContent: isMobile ? "flex-start" : "center", overflowX: isMobile ? "auto" : "visible", scrollbarWidth: "none" }}>
          {videos.map((v, i) => (
            <div
              key={v.id}
              onClick={() => onSelect?.(v)}
              style={{
                width: isMobile ? 90 : 120, height: isMobile ? 52 : 68,
                flexShrink: 0, cursor: "pointer",
                border: v.id === video.id ? "2px solid #C9A84C" : "2px solid transparent",
                opacity: v.id === video.id ? 1 : 0.4,
                transition: "all 0.2s", overflow: "hidden", position: "relative",
                borderRadius: isMobile ? 2 : 0,
              }}
              onMouseEnter={(e) => { if (v.id !== video.id) e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { if (v.id !== video.id) e.currentTarget.style.opacity = "0.4"; }}
            >
              <img src={v.thumb} alt={v.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {v.id === video.id && (
                <div style={{
                  position: "absolute", bottom: 3, left: 0, right: 0, textAlign: "center",
                  fontFamily: FB, fontSize: 7, fontWeight: 700, letterSpacing: "0.8px",
                  textTransform: "uppercase", color: "#C9A84C",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}>Playing</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VIDEO GALLERY ────────────────────────────────────────────────────────────
function VideoGallery({ videos }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(null);
  const vg = videos[active].videographer;

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Films" subtitle="Real weddings, estate tours and highlights from Villa Rosanova" />

      {/* Main featured video */}
      <div
        style={{ marginBottom: 0, position: "relative", background: "#000", cursor: "pointer", aspectRatio: "16/9", overflow: "hidden", borderRadius: isMobile ? 3 : 0 }}
        onClick={() => setPlaying(videos[active])}
        role="button"
        aria-label={`Play ${videos[active].title}`}
      >
        <img src={videos[active].thumb} alt={videos[active].title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.85 }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
          }}>
            <span style={{ fontSize: isMobile ? 16 : 20, color: "#fff", marginLeft: 3 }}>▶</span>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? "32px 16px 14px" : "40px 20px 16px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
          <div style={{ fontFamily: FD, fontSize: isMobile ? 17 : 20, color: "#fff" }}>{videos[active].title}</div>
          <div style={{ fontFamily: FB, fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{videos[active].duration} · {videos[active].type === "wedding" ? "Wedding Film" : "Estate Tour"}</div>
        </div>
      </div>

      {/* Video info bar — stacked on mobile */}
      <div className="vp-video-info" style={{
        padding: isMobile ? "14px 0" : "16px 20px", background: isMobile ? "transparent" : C.surface,
        border: isMobile ? "none" : `1px solid ${C.border}`, borderTop: "none",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 24, alignItems: isMobile ? "stretch" : "flex-start",
        marginBottom: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {videos[active].desc && (
            <p style={{ fontFamily: FB, fontSize: isMobile ? 13 : 13, color: C.textLight, lineHeight: 1.7, marginBottom: 10 }}>{videos[active].desc}</p>
          )}
          {videos[active].tags && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {videos[active].tags.map(t => (
                <span key={t} style={{
                  fontFamily: FB, fontSize: 9, color: C.textMuted,
                  background: C.bgAlt, border: `1px solid ${C.border}`,
                  padding: "2px 7px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        {vg && (
          <div style={{
            flexShrink: 0, width: isMobile ? "100%" : 200,
            padding: "10px 14px", background: C.bgAlt,
            border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)",
            display: "flex", flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "stretch",
            gap: isMobile ? 12 : 0,
          }}>
            <div style={{ flex: isMobile ? 1 : undefined }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Videographer</div>
              <div style={{ fontFamily: FD, fontSize: 15, color: C.text }}>{vg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: C.textLight, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><Icon name="pin" size={11} color={C.textLight} /> {vg.area}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {vg.instagram && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 10, opacity: 0.5 }}>📹</span>
                  <span style={{ fontFamily: FB, fontSize: 10, color: C.gold }}>{vg.instagram}</span>
                </div>
              )}
              {vg.camera && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 10, opacity: 0.5 }}>🎥</span>
                  <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted }}>{vg.camera}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip — slider on mobile, grid on desktop */}
      {isMobile ? (
        <div className="vp-films-slider" style={{
          display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          marginTop: 16, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
        }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ flex: "0 0 200px", scrollSnapAlign: "start", cursor: "pointer" }}
              onClick={() => setActive(i)}>
              <div style={{
                position: "relative", aspectRatio: "16/9", overflow: "hidden", borderRadius: 3,
                border: i === active ? `2px solid ${C.gold}` : "2px solid transparent",
              }}>
                <img src={v.thumb} alt={v.title} style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: i === active ? 1 : 0.6,
                }} />
                {i === active && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    padding: "12px 8px 6px", textAlign: "center",
                    fontFamily: FB, fontSize: 8, fontWeight: 700, letterSpacing: "0.8px",
                    textTransform: "uppercase", color: C.gold,
                  }}>Now Playing</div>
                )}
                <div onClick={(e) => { e.stopPropagation(); setPlaying(v); }} style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 10, color: "#fff", marginLeft: 2 }}>▶</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "6px 0 0" }}>
                <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{v.duration}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${videos.length}, 1fr)`, gap: 10, marginTop: 20 }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ cursor: "pointer" }} onClick={() => setActive(i)}>
              <div style={{
                position: "relative", aspectRatio: "16/9", overflow: "hidden",
                border: i === active ? `2px solid ${C.gold}` : "2px solid transparent",
              }}>
                <img src={v.thumb} alt={v.title} style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: i === active ? 1 : 0.5, transition: "opacity 0.2s",
                }}
                  onMouseEnter={(e) => { if (i !== active) e.currentTarget.style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { if (i !== active) e.currentTarget.style.opacity = "0.5"; }}
                />
                <div
                  onClick={(e) => { e.stopPropagation(); setPlaying(v); }}
                  style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "#fff", marginLeft: 2 }}>▶</span>
                  </div>
                </div>
                {i === active && (
                  <div style={{
                    position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
                    fontFamily: FB, fontSize: 8, fontWeight: 700, letterSpacing: "0.8px",
                    textTransform: "uppercase", color: C.gold, textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  }}>Now Playing</div>
                )}
              </div>
              <div style={{ padding: "8px 0 0" }}>
                <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{v.duration} · {v.videographer?.name || ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video play modal */}
      {playing && (
        <VideoPlayModal
          video={playing}
          videos={videos}
          onSelect={(v) => setPlaying(v)}
          onClose={() => setPlaying(null)}
          engagement={VENUE.engagement?.videos}
        />
      )}
    </section>
  );
}

// ─── EXCLUSIVE USE ────────────────────────────────────────────────────────────
function ExclusiveUse({ venue, onEnquire }) {
  const C = useT();
  const isMobile = useIsMobile();
  const eu = venue.exclusiveUse;

  // Section hidden if disabled or no data
  if (!eu || eu.enabled === false) return null;
  // Don't render empty shell
  if (!eu.from && !eu.description && !(eu.includes?.length)) return null;

  const title    = eu.title    || "Exclusive Use";
  const subtitle = eu.subtitle || "";
  const ctaText  = eu.ctaText  || "Enquire About Exclusive Use";
  const subline  = eu.subline  || (eu.minNights ? `Minimum ${eu.minNights} nights` : "");

  return (
    <section id="pricing" style={{ marginBottom: 56 }}>
      <SectionHeading title={title} subtitle={subtitle} />
      <div style={{ border: `1px solid ${C.goldBorder}`, background: C.goldLight, padding: isMobile ? 24 : 40 }}>
        <div className="vp-exclusive-grid" style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 32 : 48,
        }}>
          {/* Left: price + description + CTA */}
          <div>
            {eu.from && (
              <div style={{ fontFamily: FD, fontSize: isMobile ? 32 : 40, color: C.gold, marginBottom: 6, lineHeight: 1 }}>
                From {eu.from}
              </div>
            )}
            {subline && (
              <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginBottom: 24 }}>
                {subline}
              </div>
            )}
            {eu.description && (
              <div style={{ fontFamily: FB, fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 28 }}>
                {eu.description}
              </div>
            )}
            <button
              type="button"
              onClick={onEnquire}
              style={{
                padding: "13px 28px", background: C.gold, border: "none",
                borderRadius: "var(--lwd-radius-input)",
                color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 800,
                letterSpacing: "0.9px", textTransform: "uppercase", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {ctaText} →
            </button>
          </div>

          {/* Right: includes list */}
          {eu.includes?.length > 0 && (
            <div>
              <div style={{
                fontFamily: FB, fontSize: 9, color: C.textMuted,
                letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 16,
              }}>
                Exclusive use includes
              </div>
              {eu.includes.slice(0, 7).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ color: C.gold, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: FB, fontSize: 14, color: C.textMid }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── CATERING ────────────────────────────────────────────────────────────────
function CateringSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const cat = venue.catering;

  // Hide if disabled or missing
  if (!cat || cat.enabled === false) return null;

  // Only show cards with content, sorted by sortOrder
  const cards = (cat.cards || [])
    .filter(c => c.title || c.description)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 3);

  if (cards.length === 0) return null;

  // Grid cols: 3-up on desktop, adapt to card count on mobile
  const colCount = isMobile ? 1 : Math.min(cards.length, 3);

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Catering & Dining" />
      <div
        className="vp-catering-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: 20,
          marginBottom: 28,
        }}
      >
        {cards.map(c => (
          <div
            key={c.id || c.title}
            style={{ padding: 24, border: `1px solid ${C.border}`, background: C.surface }}
          >
            <div style={{ marginBottom: 12 }}>
              <Icon name={c.icon || 'dining'} size={28} color={C.gold} />
            </div>
            <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 8 }}>{c.title}</div>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, lineHeight: 1.7 }}>{c.description}</div>
            {c.subtext && (
              <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 8 }}>{c.subtext}</div>
            )}
          </div>
        ))}
      </div>

      {/* Dining styles + dietary pills */}
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        {cat.styles?.length > 0 && (
          <div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Dining styles
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cat.styles.map(s => <Pill key={s} color="gold">{s}</Pill>)}
            </div>
          </div>
        )}
        {cat.dietary?.length > 0 && (
          <div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Dietary options
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cat.dietary.map(d => (
                <Pill key={d} color="green"><Icon name="check" size={10} color={C.green} /> {d}</Pill>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SPACES ───────────────────────────────────────────────────────────────────
// ─── VENUE SPACES SECTION ─────────────────────────────────────────────────────
function SpaceCapacityRow({ space, C }) {
  const caps = [
    space.capacityCeremony != null && { label: 'Ceremony', value: space.capacityCeremony },
    space.capacityReception != null && { label: 'Reception', value: space.capacityReception },
    space.capacityDining != null && { label: 'Dining', value: space.capacityDining },
    space.capacityStanding != null && { label: 'Standing', value: space.capacityStanding },
  ].filter(Boolean);

  if (!caps.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
      {caps.map(({ label, value }) => (
        <div key={label} style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 400, color: C.text, lineHeight: 1 }}>{value}</div>
          <div style={{ fontFamily: FB, fontSize: 10, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function SpaceAttributeBadges({ space, C }) {
  const attrs = [];
  if (space.indoor != null) attrs.push(space.indoor ? '🏛 Indoor' : '🌿 Outdoor');
  if (space.covered != null && !space.indoor) attrs.push(space.covered ? '⛱ Covered' : '☀️ Open Air');
  if (space.accessible) attrs.push('♿ Accessible');
  if (!attrs.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      {attrs.map(a => (
        <span key={a} style={{
          padding: '3px 10px', fontSize: 11, fontFamily: FB,
          border: `1px solid ${C.border}`, borderRadius: 20,
          color: C.textMid, backgroundColor: C.bgAlt || C.surface,
        }}>{a}</span>
      ))}
    </div>
  );
}

function SpacesSection({ spaces }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [floorPlanModal, setFloorPlanModal] = useState(null); // { url, name }

  return (
    <section id="capacity" style={{ marginBottom: 56 }}>
      <SectionHeading
        title="Venue Spaces"
        subtitle={`${spaces.length} distinct event space${spaces.length !== 1 ? 's' : ''} — each with its own character and atmosphere`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 48 : 64 }}>
        {spaces.map((s, i) => {
          const isEven = i % 2 === 0;
          return (
            <div key={s.id || s.name} className="vp-space-card" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : (isEven ? '1fr 1fr' : '1fr 1fr'),
              gap: isMobile ? 0 : 48,
              animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              alignItems: 'center',
            }}>
              {/* Image column — full landscape, max 750px height */}
              {s.img && (
                <div style={{
                  order: isMobile ? 0 : (isEven ? 0 : 1),
                  overflow: 'hidden',
                  borderRadius: 2,
                  aspectRatio: '16 / 10',
                }}>
                  <img
                    src={s.img} alt={s.name}
                    className="lwd-img-zoom"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      maxHeight: isMobile ? '380px' : '500px',
                    }}
                  />
                </div>
              )}

              {/* Content column — editorial layout, more open spacing */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                order: isMobile ? 1 : (isEven ? 1 : 0),
              }}>
                {/* Type pill */}
                {s.type && (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '5px 14px',
                      fontSize: 10,
                      fontFamily: FB,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      border: `1px solid ${C.gold}`,
                      borderRadius: 20,
                      color: C.gold,
                      fontWeight: 700,
                    }}>{s.type}</span>
                  </div>
                )}

                {/* Space name — serif headline */}
                <div style={{
                  fontFamily: FD,
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: 400,
                  color: C.text,
                  lineHeight: 1.2,
                }}>
                  {s.name}
                </div>

                {/* Capacity numbers — clean row */}
                <SpaceCapacityRow space={s} C={C} />

                {/* Description — readable paragraph width */}
                {s.description && (
                  <p style={{
                    fontFamily: FB,
                    fontSize: 13,
                    color: C.textLight,
                    lineHeight: 1.8,
                    margin: 0,
                    maxWidth: '600px',
                  }}>
                    {s.description}
                  </p>
                )}

                {/* Attribute badges */}
                <SpaceAttributeBadges space={s} C={C} />

                {/* Floor plan link */}
                {s.floorPlanUrl && (
                  <button
                    type="button"
                    onClick={() => setFloorPlanModal({ url: s.floorPlanUrl, name: s.name })}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      fontSize: 11,
                      fontFamily: FB,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: `1px solid ${C.textMuted}`,
                      borderRadius: 2,
                      backgroundColor: 'transparent',
                      color: C.textMid,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = C.bgAlt;
                      e.currentTarget.style.borderColor = C.textMid;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = C.textMuted;
                    }}
                  >
                    📐 View Floor Plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor Plan Modal */}
      {floorPlanModal && (
        <div
          onClick={() => setFloorPlanModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: 900, width: '100%', backgroundColor: '#fff', borderRadius: 2 }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5ddd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Floor Plan — {floorPlanModal.name}</span>
              <button
                type="button"
                onClick={() => setFloorPlanModal(null)}
                style={{ border: 'none', background: 'none', fontSize: 22, color: '#888', cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>
            <img src={floorPlanModal.url} alt={`Floor plan — ${floorPlanModal.name}`} style={{ width: '100%', display: 'block', borderRadius: '0 0 2px 2px' }} />
          </div>
        </div>
      )}
    </section>
  );
}

// ─── ROOMS & ACCOMMODATION ────────────────────────────────────────────────────
function RoomsSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const acc = venue.accommodation;
  if (!acc || (!acc.totalRooms && !acc.description)) return null;
  const [roomsLightboxIdx, setRoomsLightboxIdx] = useState(null);

  return (
    <section id="rooms" style={{ marginBottom: 56 }}>
      <SectionHeading title="Rooms & Accommodation" />
      <>
        {/* Stats bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {acc.type && (
            <span style={{ padding: '5px 14px', border: `1px solid ${C.gold}`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: C.gold, fontFamily: 'var(--font-body, inherit)' }}>
              {acc.type}
            </span>
          )}
          {acc.totalRooms > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              {acc.totalRooms} Rooms
            </span>
          )}
          {acc.totalSuites > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              {acc.totalSuites} Suites
            </span>
          )}
          {acc.maxOvernightGuests > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              Up to {acc.maxOvernightGuests} guests
            </span>
          )}
          {acc.minNightStay > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              Min {acc.minNightStay} nights
            </span>
          )}
          {acc.exclusiveUse && (
            <span style={{ padding: '5px 14px', backgroundColor: 'rgba(201,168,76,0.1)', border: `1px solid ${C.gold}`, borderRadius: 20, fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: 'var(--font-body, inherit)' }}>
              ✦ Exclusive Use Available
            </span>
          )}
        </div>

        {/* Description */}
        {acc.description && (
          <div
            className="ldw-prose-body"
            style={{ marginBottom: 28 }}
            dangerouslySetInnerHTML={{ __html: acc.description }}
          />
        )}

        {/* Room images grid (max 6) */}
        {acc.images?.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {acc.images.slice(0, 6).map((src, i) => (
              <img
                key={i} src={src} alt={`Room ${i + 1}`}
                loading="lazy"
                onClick={() => setRoomsLightboxIdx(i)}
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }}
              />
            ))}
          </div>
        )}
        {roomsLightboxIdx !== null && (() => {
          const lightboxImages = (acc.images || []).slice(0, 6).map(src => ({ src, title: '' }));
          return (
            <MenuImageModal
              images={lightboxImages}
              idx={roomsLightboxIdx}
              onClose={() => setRoomsLightboxIdx(null)}
              onPrev={() => setRoomsLightboxIdx(i => Math.max(0, i - 1))}
              onNext={() => setRoomsLightboxIdx(i => Math.min(lightboxImages.length - 1, i + 1))}
            />
          );
        })()}
      </>
    </section>
  );
}

// ─── MENU IMAGE MODAL ─────────────────────────────────────────────────────────
function MenuImageModal({ images, idx, onClose, onPrev, onNext }) {
  const C = useT();
  if (idx === null || idx === undefined || !images?.[idx]) return null;
  const img = images[idx];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 760, width: '100%', position: 'relative' }}>
        <img
          src={img.src} alt={img.title}
          style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 2 }}
        />
        {img.title && (
          <p style={{
            textAlign: 'center', marginTop: 14,
            fontFamily: 'var(--font-body, inherit)', fontSize: 14,
            color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em',
          }}>
            {img.title}
          </p>
        )}
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        {/* Prev */}
        {idx > 0 && (
          <button onClick={onPrev} style={{ position: 'absolute', top: '50%', left: -52, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        )}
        {/* Next */}
        {idx < images.length - 1 && (
          <button onClick={onNext} style={{ position: 'absolute', top: '50%', right: -52, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        )}
        {/* Thumbnail strip (max 4) */}
        {images.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {images.map((img, i) => (
              <img key={i} src={img.src} alt="" onClick={() => { /* handled via onPrev/onNext */ }}
                style={{
                  width: 52, height: 36, objectFit: 'cover', borderRadius: 2,
                  cursor: 'pointer', opacity: i === idx ? 1 : 0.45,
                  border: i === idx ? '1px solid #C9A84C' : '1px solid transparent',
                  transition: 'opacity 0.15s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DINING SECTION ───────────────────────────────────────────────────────────
function DiningSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const dining = venue.dining;
  const [menuImgIdx, setMenuImgIdx] = useState(null);

  if (!dining || (!dining.description && !dining.style)) return null;

  const sideImg = dining.menuImages?.[0]?.src || venue.imgs?.[1] || venue.imgs?.[0];

  const PillGroup = ({ items, color }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {items.map(item => (
        <span key={item} style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12,
          border: color === 'gold' ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
          color: color === 'gold' ? C.gold : C.textMid,
          backgroundColor: color === 'gold' ? 'rgba(201,168,76,0.08)' : (C.bgAlt || C.surface),
          fontFamily: 'var(--font-body, inherit)',
          fontWeight: color === 'gold' ? 600 : 400,
        }}>
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <section id="dining" style={{ marginBottom: 56 }}>
      <SectionHeading title="Dining" />
      <SectionLayout sideImg={sideImg} isMobile={isMobile}>

        {/* Style + chef */}
        {dining.style && (
          <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: isMobile ? 17 : 20, fontWeight: 400, color: C.text, lineHeight: 1.35, marginBottom: 20, letterSpacing: '-0.01em' }}>
            {dining.style}
            {dining.chefName && <span style={{ display: 'block', fontFamily: 'var(--font-body, inherit)', fontSize: 13, color: C.textLight, marginTop: 6, fontStyle: 'italic' }}>Chef {dining.chefName}</span>}
          </p>
        )}

        {/* Catering badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {dining.inHouseCatering && (
            <span style={{ padding: '5px 14px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: C.green }}>✓ In-house Catering</span>
          )}
          {dining.externalCateringAllowed && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid }}>External Caterers Welcome</span>
          )}
        </div>

        {/* Menu styles */}
        {dining.menuStyles?.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 8 }}>Menu Style</p>
            <PillGroup items={dining.menuStyles} color="gold" />
          </div>
        )}

        {/* Dietary */}
        {dining.dietaryOptions?.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 8 }}>Dietary</p>
            <PillGroup items={dining.dietaryOptions} color="neutral" />
          </div>
        )}

        {/* Drinks */}
        {dining.drinksOptions?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 8 }}>Drinks</p>
            <PillGroup items={dining.drinksOptions} color="neutral" />
          </div>
        )}

        {/* Description */}
        {dining.description && (
          <div
            className="ldw-prose-body"
            style={{ marginBottom: 32 }}
            dangerouslySetInnerHTML={{ __html: dining.description }}
          />
        )}

        {/* Menu Highlights */}
        {dining.menuImages?.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 12 }}>Menu Highlights</p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(dining.menuImages.length, 4)}, 1fr)`, gap: 8 }}>
              {dining.menuImages.slice(0, 4).map((img, i) => (
                <div key={i} style={{ cursor: 'pointer' }} onClick={() => setMenuImgIdx(i)}>
                  <img
                    src={img.src} alt={img.title}
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  />
                  {img.title && (
                    <p style={{ fontSize: 11, color: C.textLight, margin: '5px 0 0', lineHeight: 1.3, fontFamily: 'var(--font-body, inherit)' }}>{img.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionLayout>

      {/* Menu image lightbox */}
      <MenuImageModal
        images={dining.menuImages || []}
        idx={menuImgIdx}
        onClose={() => setMenuImgIdx(null)}
        onPrev={() => setMenuImgIdx(i => Math.max(0, i - 1))}
        onNext={() => setMenuImgIdx(i => Math.min((dining.menuImages?.length || 1) - 1, i + 1))}
      />
    </section>
  );
}

// ─── VENUE TYPE SECTION ───────────────────────────────────────────────────────
function VenueTypeSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const vt = venue.venueType;
  if (!vt?.primaryType && !(venue.categories?.length > 0)) return null;

  const sideImg = venue.imgs?.[3] || venue.imgs?.[0];

  return (
    <section id="venue-type" style={{ marginBottom: 56 }}>
      <SectionHeading title="Venue Type" />
      <SectionLayout sideImg={sideImg} isMobile={isMobile}>
        {/* Primary type + architecture */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {vt?.primaryType && (
            <span style={{ padding: '5px 16px', border: `1px solid ${C.gold}`, borderRadius: 20, fontSize: 13, fontWeight: 700, color: C.gold }}>
              {vt.primaryType}
            </span>
          )}
          {vt?.architecture && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid }}>
              {vt.architecture} Architecture
            </span>
          )}
          {vt?.built && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid }}>
              Built {vt.built}
            </span>
          )}
        </div>

        {vt?.description && (
          <p style={{ fontFamily: 'var(--font-body, inherit)', fontSize: 14, color: C.textMid, lineHeight: 1.75, marginBottom: 24 }}>
            {vt.description}
          </p>
        )}

        {/* Style tags */}
        {vt?.styles?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 10 }}>Style</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {vt.styles.map(s => (
                <span key={s} style={{ padding: '4px 12px', border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, backgroundColor: C.bgAlt || C.surface }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features checklist */}
        {vt?.features?.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 10 }}>Features</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 8 }}>
              {vt.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMid }}>
                  <span style={{ color: C.gold, fontSize: 11 }}>✦</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionLayout>
    </section>
  );
}

// ─── WEDDING WEEKEND ─────────────────────────────────────────────────────────
function WeddingWeekend({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const ww = venue.weddingWeekend;
  if (!ww || ww.enabled === false) return null;
  const experiences = venue.experiences || [];
  const estate  = venue.estateEnabled !== false ? experiences.filter(e => e.category === "estate").slice(0, 6) : [];
  const nearby  = venue.nearbyEnabled !== false ? experiences.filter(e => e.category === "nearby").slice(0, 6) : [];
  const formatDistance = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  };

  const experienceRow = (exp) => (
    <div key={exp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.bgAlt || C.bg, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Icon name={EXPERIENCE_KIND_SET.has(exp.kind) ? exp.kind : "nature"} size={18} color={C.textMid} />
        <span style={{ fontFamily: FB, fontSize: 13, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.label}</span>
        {exp.isIncluded && (
          <span style={{ fontFamily: FB, fontSize: 9, color: C.gold, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", border: `1px solid ${C.goldBorder || C.gold}`, background: C.goldLight || "transparent", flexShrink: 0 }}>Included</span>
        )}
        {exp.isPrivate && (
          <span style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", border: `1px solid ${C.border}`, flexShrink: 0 }}>Private</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {exp.season && exp.season !== "all-year" && (
          <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, fontStyle: "italic" }}>{exp.season}</span>
        )}
        {exp.distanceMinutes && (
          <span style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 600 }}>{formatDistance(exp.distanceMinutes)}</span>
        )}
      </div>
    </div>
  );

  const days = (ww.days || [])
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 4)
    .map(d => ({
      ...d,
      day:   String(d.day   || '').slice(0, 12),
      title: String(d.title || '').slice(0, 28),
      desc:  String(d.desc  || '').slice(0, 110),
    }));

  const dayCard = (d) => (
    <div key={d.day} style={{ padding: 20, border: `1px solid ${C.border}`, background: C.surface, flex: isMobile ? "0 0 220px" : undefined, scrollSnapAlign: isMobile ? "start" : undefined, minHeight: isMobile ? undefined : 130, overflow: 'hidden' }}>
      <div style={{ fontFamily: FB, fontSize: 10, color: C.gold, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{d.day}</div>
      <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 8 }}>{d.title}</div>
      <p style={{ fontFamily: FB, fontSize: 12, color: C.textLight, lineHeight: 1.65 }}>{d.desc}</p>
    </div>
  );

  return (
    <section id="things-to-do" style={{ marginBottom: 56 }}>
      <SectionHeading title="Your Wedding Weekend" subtitle={ww.subtitle || ''} />
      {/* Days */}
      {isMobile ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", marginBottom: 36, scrollbarWidth: "none", msOverflowStyle: "none" }} className="vp-weekend-slider">
          {days.map(dayCard)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(days.length, 4)}, 1fr)`, gap: 12, marginBottom: 36 }}>
          {days.map(dayCard)}
        </div>
      )}
    </section>
  );
}

// ─── EXPERIENCES ──────────────────────────────────────────────────────────────
// On the Estate + Nearby Experiences section for the reading journey
function ExperiencesDisplay({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const experiences = venue.experiences || [];
  const estate  = venue.estateEnabled !== false ? experiences.filter(e => e.category === "estate").slice(0, 6) : [];
  const nearby  = venue.nearbyEnabled !== false ? experiences.filter(e => e.category === "nearby").slice(0, 6) : [];

  if (estate.length === 0 && nearby.length === 0) return null;

  const formatDistance = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  };

  const experienceRow = (exp) => (
    <div key={exp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.bgAlt || C.bg, border: `1px solid ${C.border}`, borderRadius: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Icon name={EXPERIENCE_KIND_SET.has(exp.kind) ? exp.kind : "nature"} size={18} color={C.textMid} />
        <span style={{ fontFamily: FB, fontSize: 13, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.label}</span>
        {exp.isIncluded && (
          <span style={{ fontFamily: FB, fontSize: 9, color: C.gold, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", border: `1px solid ${C.goldBorder || C.gold}`, background: C.goldLight || "transparent", flexShrink: 0 }}>Included</span>
        )}
        {exp.isPrivate && (
          <span style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", border: `1px solid ${C.border}`, flexShrink: 0 }}>Private</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {exp.season && exp.season !== "all-year" && (
          <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, fontStyle: "italic" }}>{exp.season}</span>
        )}
        {exp.distanceMinutes && (
          <span style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 600 }}>{formatDistance(exp.distanceMinutes)}</span>
        )}
      </div>
    </div>
  );

  return (
    <section id="experiences" style={{ marginBottom: 56 }}>
      <SectionHeading title="On the Estate & Nearby Experiences" />
      <div className="vp-experiences-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (estate.length > 0 && nearby.length > 0 ? "1fr 1fr" : "1fr"), gap: isMobile ? 24 : 32 }}>
        {[
          estate.length > 0 && { title: "On the Estate", items: estate },
          nearby.length > 0 && { title: "Nearby Experiences", items: nearby },
        ].filter(Boolean).map(g => (
          <div key={g.title}>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 14 }}>{g.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {g.items.map(experienceRow)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── GETTING HERE ─────────────────────────────────────────────────────────────
function GettingHere({ access }) {
  const C = useT();
  const formatDrive = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  };
  const driveColor = (mins) => {
    if (mins < 60) return C.green;
    if (mins < 100) return C.gold;
    return C.textLight;
  };

  return (
    <section id="availability" style={{ marginBottom: 56 }}>
      <SectionHeading title="Getting Here" subtitle="International airports serving Villa Rosanova, with transfer options for your guests" />

      {/* Helicopter callout */}
      {access.helicopterTransferAvailable && (
        <div style={{ marginBottom: 20, padding: "14px 20px", background: C.goldLight, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="helicopter" size={22} color={C.gold} />
          <div>
            <span style={{ fontFamily: FB, fontSize: 14, fontWeight: 700, color: C.gold }}>Helicopter transfers available</span>
            {access.helicopterTransferMinutesFromAirport && (
              <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginLeft: 8 }}>
                {access.helicopterTransferMinutesFromAirport} min from {access.primaryAirport.code}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Primary airport highlight */}
      {access.primaryAirport && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="airport" size={14} color={C.gold} />
          <span style={{ fontFamily: FB, fontSize: 13, color: C.textMid }}>
            Closest international airport: <strong style={{ color: C.text, fontWeight: 600 }}>{access.primaryAirport.name}</strong>, {formatDrive(access.primaryAirport.driveTimeMinutes)}
          </span>
        </div>
      )}

      {/* Airport table */}
      <div style={{ border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: C.bgAlt || C.bg, borderBottom: `1px solid ${C.border}`, padding: "10px 20px" }}>
          {["Airport", "Drive time", "Distance"].map(h => (
            <div key={h} style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {access.airports.map((a, i) => (
          <div key={a.code} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
            padding: "16px 20px", alignItems: "center",
            borderBottom: i < access.airports.length - 1 ? `1px solid ${C.border}` : "none",
            background: C.surface,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="airport" size={16} color={C.textMuted} />
              <div>
                <span style={{ fontFamily: FD, fontSize: 17, color: C.text }}>{a.name}</span>
                <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, marginLeft: 8, padding: "2px 6px", border: `1px solid ${C.border2}` }}>{a.code}</span>
              </div>
            </div>
            <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 700, color: driveColor(a.driveTimeMinutes) }}>{formatDrive(a.driveTimeMinutes)}</div>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>{a.distanceKm ? `${a.distanceKm} km` : ""}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
function Reviews({ testimonials, venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const PER_PAGE = 3;
  const pages = Math.ceil(testimonials.length / PER_PAGE);
  const [page, setPage] = useState(0);
  const visible = testimonials.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const navBtn = (dir) => ({
    width: 36, height: 36, borderRadius: "var(--lwd-radius-input)", border: `1px solid ${C.border2}`,
    background: "none", color: C.textMuted, cursor: "pointer",
    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s", flexShrink: 0,
  });

  const reviewCard = (r) => (
    <div key={r.id} style={{ padding: isMobile ? 20 : 24, border: `1px solid ${C.border}`, background: C.surface, borderTop: `3px solid ${C.gold}`, animation: "fadeUp 0.35s ease both", flex: isMobile ? "0 0 280px" : undefined, scrollSnapAlign: isMobile ? "start" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, background: C.goldLight, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FD, fontSize: 16, color: C.gold, flexShrink: 0 }}>{r.avatar}</div>
        <div>
          <div style={{ fontFamily: FD, fontSize: 16, color: C.text }}>{r.names}</div>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>{r.date} · {r.location}</div>
        </div>
      </div>
      <Stars rating={r.rating} size={12} />
      <p style={{ fontFamily: FB, fontSize: 13, color: C.textMid, lineHeight: 1.75, marginTop: 12, ...(isMobile ? { display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}) }}>{r.text}</p>
      <div style={{ marginTop: 14 }}>
        <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Verified Review</span>
      </div>
    </div>
  );

  return (
    <section id="reviews" style={{ marginBottom: 56 }}>
      <SectionHeading title="Reviews" />
      <>

        {/* Summary bar */}
        <div className="vp-reviews-summary" style={{ display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : undefined, gridTemplateColumns: isMobile ? undefined : "200px 1fr", gap: isMobile ? 20 : 40, marginBottom: 28, padding: isMobile ? 20 : 32, border: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ textAlign: "center", borderRight: isMobile ? "none" : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : "none", paddingRight: isMobile ? 0 : 40, paddingBottom: isMobile ? 16 : 0 }}>
            <div style={{ fontFamily: FD, fontSize: isMobile ? 56 : 78, fontWeight: 400, color: C.gold, lineHeight: 1 }}>{venue.rating}</div>
            <Stars rating={venue.rating} size={18} />
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginTop: 8 }}>{venue.reviews} verified reviews</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            {[5,4,3,2,1].map(star => (
              <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, width: 16 }}>{star}</span>
                <span style={{ fontSize: 11, color: C.gold }}>★</span>
                <div style={{ flex: 1, height: 6, background: C.border, overflow: "hidden" }}>
                  <div style={{ width: star === 5 ? "89%" : star === 4 ? "8%" : "3%", height: "100%", background: C.gold, transition: "width 0.8s ease" }} />
                </div>
                <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, width: 28 }}>{star === 5 ? "113" : star === 4 ? "10" : "4"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review cards — slider on mobile, paginated grid on desktop */}
        {isMobile ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", marginBottom: 20, scrollbarWidth: "none", msOverflowStyle: "none" }} className="vp-reviews-slider">
            {testimonials.map(reviewCard)}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
              {visible.map(reviewCard)}
            </div>

            {/* Navigation row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* Dot indicators */}
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: pages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i)} style={{
                    width: i === page ? 20 : 8, height: 8, borderRadius: 4,
                    background: i === page ? C.gold : C.border2,
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.3s ease",
                  }} />
                ))}
              </div>

              {/* Prev / count / Next */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>
                  {page * PER_PAGE + 1}–{Math.min(page * PER_PAGE + PER_PAGE, testimonials.length)} of {testimonials.length}
                </span>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ ...navBtn(), opacity: page === 0 ? 0.35 : 1 }}
                  onMouseEnter={e => { if (page > 0) { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMuted; }}
                >←</button>
                <button
                  onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                  disabled={page === pages - 1}
                  style={{ ...navBtn(), opacity: page === pages - 1 ? 0.35 : 1 }}
                  onMouseEnter={e => { if (page < pages - 1) { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMuted; }}
                >→</button>
              </div>
            </div>
          </>
        )}
      </>
    </section>
  );
}

// ─── ENQUIRY MODAL (shared: FAQ CTA, hero CTA, compare bar) ──────────────────
function EnquiryModal({ venue, onClose }) {
  const C = useT();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    hasDate: null, date: "", year: "", season: "",
    guests: "", budget: "",
    name1: "", name2: "", email: "", phone: "",
  });
  const [sent, setSent] = useState(false);

  const STEPS = 3;
  const years   = ["2025", "2026", "2027", "2028", "Not sure"];
  const seasons = ["Spring  Mar–May", "Summer  Jun–Aug", "Autumn  Sep–Nov", "Winter  Dec–Feb"];
  const guestTiers  = ["Up to 50", "50–80", "80–120", "120–180", "180+"];
  const budgetTiers = ["Under £15k", "£15–25k", "£25–50k", "£50k+"];

  const pill = (val, active, onClick) => (
    <button key={val} onClick={onClick} style={{
      padding: "8px 14px", border: `1px solid ${active ? C.gold : C.border2}`, borderRadius: "var(--lwd-radius-input)",
      background: active ? C.goldLight : "none",
      color: active ? C.gold : C.textMid,
      fontFamily: FB, fontSize: 12, fontWeight: active ? 700 : 400,
      cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.2px",
    }}>{val}</button>
  );

  const canNext = () => {
    if (step === 1) return form.hasDate !== null && (form.hasDate ? !!form.date : (!!form.year && !!form.season));
    if (step === 2) return !!form.guests;
    if (step === 3) return !!(form.name1 && form.email);
    return false;
  };

  const prefilledMsg = () =>
    `Hi, we're ${form.name1}${form.name2 ? " & " + form.name2 : ""}. We're planning a ${form.hasDate ? `wedding on ${form.date}` : `${form.season?.split("  ")[0].toLowerCase()} ${form.year} wedding`} for ${form.guests} guests${form.budget ? " with a budget of " + form.budget : ""}. We'd love to learn more about ${venue.name} — could you share availability and pricing?`;

  const echoSummary = () => {
    const datePart = form.hasDate
      ? new Date(form.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : [form.season?.split("  ")[0], form.year].filter(Boolean).join(" ");
    return [datePart, form.guests ? `${form.guests} guests` : "", form.budget].filter(Boolean).join("  ·  ");
  };

  if (sent) return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, maxWidth: 480, width: "90vw",
        border: `1px solid ${C.border}`, boxShadow: C.shadowLg,
        animation: "lwd-modal-in 0.3s ease", overflow: "hidden",
      }}>
        {/* Venue photo banner */}
        <div style={{ height: 130, position: "relative", overflow: "hidden" }}>
          <img src={venue.imgs[0]} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 100%)" }} />
          <div style={{ position: "absolute", bottom: 14, left: 24, fontFamily: FD, fontSize: 13, color: "rgba(255,255,255,0.8)", letterSpacing: "0.4px" }}>{venue.name} · {venue.location}</div>
        </div>

        {/* Gold ✓ circle — floats on the seam */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: -28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "#0f0d0a", fontWeight: 700,
            border: `3px solid ${C.surface}`, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>✓</div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 32px 32px", textAlign: "center" }}>
          <h3 style={{ fontFamily: FD, fontSize: 26, color: C.text, marginBottom: 10, lineHeight: 1.2 }}>Enquiry received</h3>
          <p style={{ fontFamily: FB, fontSize: 14, color: C.textLight, lineHeight: 1.75, marginBottom: 20 }}>
            <strong style={{ color: C.text, fontWeight: 600 }}>{venue.owner.name.split(" ")[0]}</strong> will personally review your enquiry and respond within{" "}
            <strong style={{ color: C.text, fontWeight: 600 }}>{venue.responseTime}</strong>.
          </p>

          {/* Echo card — reflects their selections back */}
          <div style={{
            background: C.goldLight, border: `1px solid ${C.goldBorder}`,
            borderRadius: "var(--lwd-radius-card)", padding: "14px 18px", marginBottom: 24, textAlign: "left",
          }}>
            <div style={{ fontFamily: FB, fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Your enquiry summary</div>
            <div style={{ fontFamily: FD, fontSize: 14, color: C.text, lineHeight: 1.65 }}>{echoSummary()}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, marginTop: 6 }}>Confirmation sent to {form.email}</div>
          </div>

          <button onClick={onClose} style={{
            padding: "12px 36px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#0f0d0a", fontFamily: FB, fontSize: 12, fontWeight: 800,
            letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer",
          }}>Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.58)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 520, border: `1px solid ${C.border}`, boxShadow: C.shadowLg, position: "relative" }}>

        {/* Gold top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />

        {/* Header */}
        <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4 }}>Enquire about {venue.name}</div>
            <h3 style={{ fontFamily: FD, fontSize: 22, color: C.text, margin: 0 }}>
              {step === 1 ? "When is your celebration?" : step === 2 ? "Tell us about your plans" : "Your details"}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: C.textMuted, cursor: "pointer", lineHeight: 1, padding: "0 0 0 16px" }}>✕</button>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, padding: "16px 28px 0" }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: s <= step ? C.gold : C.border, borderRadius: 2, transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ padding: "6px 28px 0", fontFamily: FB, fontSize: 11, color: C.textMuted }}>Step {step} of {STEPS}</div>

        {/* Step content */}
        <div style={{ padding: "20px 28px 0" }}>

          {/* Step 1 — Date */}
          {step === 1 && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[{v: true, l: "I have a date"}, {v: false, l: "Not yet"}].map(o => (
                  <button key={o.l} onClick={() => setForm(f => ({ ...f, hasDate: o.v }))} style={{
                    flex: 1, padding: "11px", border: `1px solid ${form.hasDate === o.v ? C.gold : C.border2}`,
                    borderRadius: "var(--lwd-radius-input)",
                    background: form.hasDate === o.v ? C.goldLight : "none",
                    color: form.hasDate === o.v ? C.gold : C.textMid,
                    fontFamily: FB, fontSize: 13, fontWeight: form.hasDate === o.v ? 700 : 400, cursor: "pointer",
                  }}>{o.l}</button>
                ))}
              </div>
              {form.hasDate === true && (
                <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
                  style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 14, outline: "none" }} />
              )}
              {form.hasDate === false && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Year</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {years.map(y => pill(y, form.year === y, () => setForm(f => ({...f, year: y}))))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Season</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {seasons.map(s => pill(s, form.season === s, () => setForm(f => ({...f, season: s}))))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Guests + Budget */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Approx. guest count</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {guestTiers.map(g => pill(g, form.guests === g, () => setForm(f => ({...f, guests: g}))))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Approximate budget <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {budgetTiers.map(b => pill(b, form.budget === b, () => setForm(f => ({...f, budget: b}))))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Contact */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{k:"name1",ph:"Your name *"},{k:"name2",ph:"Partner's name"}].map(f => (
                  <input key={f.k} placeholder={f.ph} value={form[f.k]} onChange={e => setForm(fm => ({...fm, [f.k]: e.target.value}))}
                    style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 13, outline: "none" }} />
                ))}
              </div>
              <input placeholder="Email address *" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 13, outline: "none", width: "100%" }} />
              <input placeholder="Phone number (optional)" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 13, outline: "none", width: "100%" }} />
              <textarea rows={3} defaultValue={prefilledMsg()}
                style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 12, outline: "none", resize: "none", lineHeight: 1.6 }} />
              <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>✓ You'll receive a copy of this enquiry by email</div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding: "20px 28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", fontFamily: FB, fontSize: 13, color: C.textLight, cursor: "pointer", padding: 0 }}>← Back</button>
            : <div />
          }
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{
                padding: "11px 28px", background: canNext() ? C.gold : C.border, border: "none", borderRadius: "var(--lwd-radius-input)",
                color: canNext() ? "#fff" : C.textMuted, fontFamily: FB, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.8px", textTransform: "uppercase", cursor: canNext() ? "pointer" : "default", transition: "all 0.2s",
              }}>Continue →</button>
            : <button onClick={() => setSent(true)} disabled={!canNext()} style={{
                padding: "11px 28px", background: canNext() ? C.gold : C.border, border: "none", borderRadius: "var(--lwd-radius-input)",
                color: canNext() ? "#fff" : C.textMuted, fontFamily: FB, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.8px", textTransform: "uppercase", cursor: canNext() ? "pointer" : "default",
              }}>✦ Send enquiry</button>
          }
        </div>

        {/* Social proof */}
        <div style={{ padding: "0 28px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="zap" size={12} color={C.green} /> Responds in {venue.responseTime}</span>
          <span style={{ width: 1, height: 10, background: C.border }} />
          <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>{venue.responseRate}% response rate</span>
          <span style={{ width: 1, height: 10, background: C.border }} />
          <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>🔥 3 enquired this week</span>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_DATA = [
  {
    category: "The Venue",
    icon: "I",
    questions: [
      { q: "Is Villa Rosanova available for exclusive use?", a: "Yes — Villa Rosanova is available for exclusive hire from Thursday to Sunday. Exclusive use includes all 24 bedrooms and 6 suites, full use of the grounds, gardens, pool pavilion and all venue spaces. Pricing from £28,000 for the full weekend." },
      { q: "What is the maximum guest capacity?", a: "The estate accommodates up to 200 guests for a ceremony, 160 for a seated dinner and 180 for a standing reception. For intimate celebrations, we welcome parties from 20 guests." },
      { q: "Can we hold both the ceremony and reception here?", a: "Absolutely. The Cypress Garden seats 200 for outdoor ceremonies, while the Grand Salon accommodates 160 for indoor ceremonies. All reception spaces are on the same estate." },
    ],
  },
  {
    category: "Catering & Drink",
    icon: "II",
    questions: [
      { q: "Do you work with an in-house caterer or can we bring our own?", a: "We have an award-winning in-house culinary team led by Chef Marco Bellini. External caterers are permitted with prior approval and a corkage arrangement. Our sommelier curates a bespoke wine list featuring our own estate Chianti Classico." },
      { q: "Can you accommodate dietary requirements?", a: "Yes — our kitchen is fully equipped to cater for vegan, vegetarian, halal, kosher and gluten-free guests. Please advise your dedicated event planner of any requirements when confirming your booking." },
      { q: "Is there a corkage fee if we bring our own wine?", a: "External wine and spirits are welcome at £18 per bottle. We recommend our estate wine list as a first choice — our Chianti Classico is particularly popular with guests." },
    ],
  },
  {
    category: "Accommodation",
    icon: "III",
    questions: [
      { q: "How many guests can stay on the estate overnight?", a: "Villa Rosanova sleeps 58 guests across 24 bedrooms and 6 suites. All rooms are uniquely decorated and include en-suite bathrooms. Bridal and groom suites are available with dedicated dressing areas." },
      { q: "What are the check-in and check-out times?", a: "Check-in is from 3pm on your arrival day. Check-out is by 11am on your departure day. For exclusive use bookings, we are flexible around your schedule — please discuss timing with your event planner." },
    ],
  },
  {
    category: "Getting Here",
    icon: "IV",
    questions: [
      { q: "What is the closest airport?", a: "Florence Airport (FLR) is 45 minutes by car (42km). We can arrange private transfers and helicopter arrivals from FLR — 20 minutes by helicopter. Pisa (PSA) is 70 minutes and Bologna (BLQ) is 90 minutes." },
      { q: "Is there parking on the estate?", a: "Yes — complimentary secure parking for up to 60 vehicles within the estate grounds. For larger parties, additional overflow parking is available 200m from the entrance with a complimentary shuttle." },
    ],
  },
  {
    category: "Planning & Suppliers",
    icon: "V",
    questions: [
      { q: "Do we need to use your recommended suppliers?", a: "We have a curated list of preferred suppliers — florists, photographers, bands and planners — who know the estate well. However, you are welcome to bring your own suppliers subject to prior approval from our events team." },
      { q: "How far in advance should we book?", a: "Peak summer dates (June–September) book 18–24 months in advance. Spring and autumn dates are often available with 12 months' notice. We recommend securing your date as early as possible to avoid disappointment." },
      { q: "Is a wedding planner included in the venue hire?", a: "A dedicated Villa Rosanova event coordinator is included and will work with you from enquiry through to your wedding day. For full planning services, we can recommend our preferred wedding planning partners." },
    ],
  },
];

function FAQSection({ venue, onAsk }) {
  const C = useT();
  const [openItems, setOpenItems] = useState({});
  const faqData = venue?.faq;
  if (!faqData || faqData.enabled === false) return null;
  const categories = (faqData.categories || []).filter(c => c.questions?.length > 0).slice(0, 4);
  if (categories.length === 0) return null;

  const toggle = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section id="faqs" style={{ marginBottom: 56 }}>
      <SectionHeading
        title={faqData.title || "FAQs"}
        subtitle={faqData.subtitle || ""}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {categories.map((cat, catIdx) => (
          <div key={cat.category} style={{
            background: C.bgAlt,
            border: `1px solid ${C.border}`,
            padding: "24px 28px",
          }}>
            {/* Category label */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              marginBottom: 16, paddingBottom: 14,
              borderBottom: `1px solid ${C.goldBorder}`,
            }}>
              <span style={{
                fontFamily: FD,
                fontSize: 11,
                color: C.gold,
                letterSpacing: "2px",
                minWidth: 24,
                textAlign: "center",
                opacity: 0.9,
              }}>{cat.icon}</span>
              <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "1.8px", textTransform: "uppercase" }}>{cat.category}</span>
            </div>

            {/* Questions */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cat.questions.map((item, qIdx) => {
                const isOpen = openItems[`${catIdx}-${qIdx}`];
                return (
                  <div key={qIdx} style={{ borderBottom: `1px solid ${C.border}` }}>
                    {/* Question row */}
                    <button
                      onClick={() => toggle(catIdx, qIdx)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 16,
                        padding: "21px 0", background: "none", border: "none",
                        cursor: "pointer", textAlign: "left",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      <span style={{
                        fontFamily: FB, fontSize: 14, fontWeight: 600,
                        color: isOpen ? C.gold : C.text,
                        lineHeight: 1.4, flex: 1,
                        transition: "color 0.2s",
                      }}>{item.q}</span>
                      <span style={{
                        fontSize: 18, color: isOpen ? C.gold : C.textMuted,
                        flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease, color 0.2s",
                        display: "inline-block", fontWeight: 300,
                        lineHeight: 1,
                      }}>+</span>
                    </button>

                    {/* Answer — smooth height transition */}
                    <div style={{
                      overflow: "hidden",
                      maxHeight: isOpen ? 300 : 0,
                      transition: "max-height 0.4s ease",
                    }}>
                      <p style={{
                        fontFamily: FB, fontSize: 14, color: C.textLight,
                        lineHeight: 1.8, paddingBottom: 18,
                        margin: 0, paddingRight: 32,
                      }}>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {faqData.ctaEnabled !== false && (
        <div style={{
          marginTop: 32, padding: "20px 24px",
          background: C.goldLight, border: `1px solid ${C.goldBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: FD, fontSize: 17, color: C.text, marginBottom: 4 }}>{faqData.ctaHeadline || "Still have a question?"}</div>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>{faqData.ctaSubtext || "Our team is here to help."}</div>
          </div>
          <button style={{
            padding: "11px 24px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.8px", textTransform: "uppercase", cursor: "pointer",
            flexShrink: 0, transition: "opacity 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          onClick={onAsk}>{faqData.ctaButtonText || "Ask a question"} →</button>
        </div>
      )}
    </section>
  );
}

// ─── SIMILAR VENUES ───────────────────────────────────────────────────────────
// Recommendation logic (production): query venues WHERE country = venue.country
// AND region = venue.region AND venueType = venue.venueType, ordered by
// price proximity and capacity overlap. Max 3 results.
// Admin can override via venue.similarVenuesManualOverride (array of venue objects).
function SimilarVenues({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();

  // Admin toggle guard
  if (venue.similarVenuesEnabled === false) return null;

  // Manual admin override takes priority; fallback to pre-computed similar list
  const venues = (
    venue.similarVenuesManualOverride?.length
      ? venue.similarVenuesManualOverride
      : venue.similar || []
  ).slice(0, 3);

  if (venues.length === 0) return null;

  return (
    <section id="you-might-also-love" style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionHeading title="You Might Also Love" />
      </div>
      <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, marginBottom: 24, marginTop: -20 }}>
        ✦ Curated based on location, venue type &amp; capacity
      </div>
      {isMobile ? (
        <SliderNav className="venue-similar-slider" cardWidth={300} gap={12}>
          {venues.map(({ location: loc, ...rest }) => (
            <div key={rest.id} style={{ flex: "0 0 300px", scrollSnapAlign: "start" }}>
              <GCardMobile
                v={{ ...rest, region: loc, image: rest.img, priceFrom: rest.price }}
                saved={false}
                onSave={() => {}}
                onView={() => {}}
              />
            </div>
          ))}
        </SliderNav>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${venues.length}, 1fr)`, gap: 16 }}>
          {venues.map(v => (
            <div key={v.id} style={{ border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", cursor: "pointer", borderRadius: 2 }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = C.shadowMd}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ overflow: "hidden", aspectRatio: "1/1" }}>
                <img src={v.img} alt={v.name} className="lwd-img-zoom" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="pin" size={12} color={C.textLight} /> {v.location}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Stars rating={v.rating} size={11} />
                    <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight }}>{v.rating}</span>
                  </div>
                  <span style={{ fontFamily: FD, fontSize: 16, color: C.gold }}>From {v.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── RECENTLY VIEWED ──────────────────────────────────────────────────────────
// Reads from localStorage (ldw_recently_viewed). Excludes current venue.
// Max 3 cards shown. Section hidden if empty or admin-disabled.
function RecentlyViewed({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Read stored visits, exclude current venue, cap at 3
    const stored = getRVList()
      .filter(v => v.id !== venue.id)
      .slice(0, 3);
    setItems(stored);
  }, [venue.id]);

  // Admin toggle guard + empty guard
  if (venue.recentlyViewedEnabled === false || items.length === 0) return null;

  return (
    <section id="recently-viewed" style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionHeading title="Recently Viewed" />
      </div>
      <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, marginBottom: 24, marginTop: -20 }}>
        ✦ Based on your browsing session
      </div>
      {isMobile ? (
        <SliderNav className="venue-recent-slider" cardWidth={300} gap={12}>
          {items.map(({ location: loc, img, price, ...rest }) => (
            <div key={rest.id} style={{ flex: "0 0 300px", scrollSnapAlign: "start" }}>
              <GCardMobile
                v={{ ...rest, region: loc, image: img, priceFrom: price }}
                saved={false}
                onSave={() => {}}
                onView={() => {}}
              />
            </div>
          ))}
        </SliderNav>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 16 }}>
          {items.map(v => (
            <div key={v.id} style={{ border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", cursor: "pointer", borderRadius: 2 }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = C.shadowMd}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ overflow: "hidden", aspectRatio: "1/1" }}>
                <img src={v.img} alt={v.name} className="lwd-img-zoom" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="pin" size={12} color={C.textLight} /> {v.location}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Stars rating={v.rating} size={11} />
                    <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight }}>{v.rating}</span>
                  </div>
                  <span style={{ fontFamily: FD, fontSize: 16, color: C.gold }}>From {v.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── MOBILE LEAD BAR ─────────────────────────────────────────────────────────
function MobileLeadBar({ venue }) {
  const C = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lwd-mobile-bar" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
        background: C.surface, borderTop: `1px solid ${C.border}`,
        padding: "12px 20px", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        animation: "slideUp 0.4s ease",
      }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 18, color: C.gold }}>From {venue.priceFrom}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Stars rating={venue.rating} size={11} />
            <span style={{ fontFamily: FB, fontSize: 11, color: C.textLight }}>{venue.reviews} reviews</span>
          </div>
        </div>
        <button onClick={() => setOpen(true)} style={{
          padding: "12px 24px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
          color: "#fff", fontFamily: FB, fontSize: 13, fontWeight: 700,
          letterSpacing: "0.6px", textTransform: "uppercase", cursor: "pointer",
        }}>Send Enquiry</button>
      </div>
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 950,
          display: "flex", alignItems: "flex-end",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", background: C.surface, padding: 24,
            borderTop: `3px solid ${C.gold}`,
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: FD, fontSize: 22, color: C.text }}>Send Enquiry</div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 22, color: C.textMuted, cursor: "pointer" }}>×</button>
            </div>
            <LeadForm venue={venue} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── COMPARE BAR ─────────────────────────────────────────────────────────────
function CompareBar({ items, onRemove, onClear }) {
  const C = useT();
  if (!items.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 850,
      background: C.text, borderTop: `2px solid ${C.gold}`,
      padding: "12px 32px", display: "flex", alignItems: "center", gap: 12,
      animation: "slideUp 0.3s ease",
    }}>
      <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>Compare:</span>
      {items.map(v => (
        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <span style={{ fontFamily: FB, fontSize: 12, color: "#fff" }}>{v.name}</span>
          <button onClick={() => onRemove(v.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
      ))}
      {items.length < 3 && (
        <div style={{ padding: "5px 12px", border: "1px dashed rgba(255,255,255,0.25)", fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>+ Add venue</div>
      )}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button onClick={onClear} style={{ padding: "6px 14px", background: "none", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "var(--lwd-radius-input)", color: "rgba(255,255,255,0.6)", fontFamily: FB, fontSize: 12, cursor: "pointer" }}>Clear</button>
        <button style={{ padding: "6px 20px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)", color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Compare Now →</button>
      </div>
    </div>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  // Always dark — luxury brand standard, independent of light/dark page theme
  const bg      = "#0c0c0a";
  const bgMid   = "#111110";
  const gold    = "#b8a05a";
  const green   = "#8fa08c";
  const text    = "#f5f2ec";
  const muted   = "#6b6860";
  const border  = "#252522";

  const cols = [
    {
      title: "Venues",
      links: ["By Country", "By Style", "By Capacity", "Destination Weddings", "Exclusive Use Venues"],
    },
    {
      title: "Inspiration",
      links: ["Real Weddings", "Planning Guides", "Checklists", "Video Tours", "Honeymoon Ideas"],
    },
    {
      title: "Help",
      links: ["How it Works", "FAQs", "Contact Us", "List Your Venue", "Advertise with LWD"],
    },
    {
      title: "Company",
      links: ["About LWD", "Press & Media", "Careers", "Partnerships", "LWD Foundation"],
    },
  ];

  const socials = [
    { label: "Instagram", icon: "◈" },
    { label: "Pinterest",  icon: "⊕" },
    { label: "TikTok",     icon: "▷" },
    { label: "YouTube",    icon: "▶" },
    { label: "Facebook",   icon: "ƒ" },
  ];

  return (
    <footer style={{ background: bg, color: text }}>
      {/* Gold accent line at top */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${gold}, ${green}, transparent)` }} />

      {/* Main grid */}
      <div className="vp-footer-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 40px 56px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 48 }}>

        {/* Brand column */}
        <div>
          {/* Wordmark */}
          <div style={{ fontFamily: FD, fontSize: 20, letterSpacing: "3px", color: gold, marginBottom: 6, lineHeight: 1.1 }}>
            LUXURY WEDDING<br />DIRECTORY
          </div>
          <div style={{ width: 36, height: 1, background: `linear-gradient(90deg, ${gold}, ${green})`, marginBottom: 22 }} />

          <p style={{ fontFamily: FB, fontSize: 13, color: muted, lineHeight: 1.85, maxWidth: 240, marginBottom: 32 }}>
            The world's most trusted directory of extraordinary wedding venues. Handpicked. Verified. Exceptional.
          </p>

          {/* Social icons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            {socials.map(s => (
              <button key={s.label} title={s.label} style={{
                width: 38, height: 38, border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
                background: "none", color: muted, fontSize: 15,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}
              >{s.icon}</button>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 10 }}>
            {["LWD Verified", "Est. 2006"].map(b => (
              <div key={b} style={{
                padding: "5px 12px", border: `1px solid ${border}`,
                fontFamily: FB, fontSize: 10, color: muted,
                letterSpacing: "0.8px", textTransform: "uppercase",
              }}>{b}</div>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {cols.map(col => (
          <div key={col.title}>
            <div style={{ fontFamily: FB, fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase", color: gold, marginBottom: 22, fontWeight: 700 }}>{col.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {col.links.map(link => (
                <a key={link} href="#" style={{ fontFamily: FB, fontSize: 13, color: muted, textDecoration: "none", transition: "color 0.18s", letterSpacing: "0.1px" }}
                  onMouseEnter={e => e.currentTarget.style.color = text}
                  onMouseLeave={e => e.currentTarget.style.color = muted}
                >{link}</a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter strip */}
      <div style={{ background: bgMid, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontFamily: FD, fontSize: 18, color: text, marginBottom: 4 }}>The LWD Edit — monthly inspiration for couples</div>
            <div style={{ fontFamily: FB, fontSize: 13, color: muted }}>Extraordinary venues, real weddings, and planning guides. No spam.</div>
          </div>
          <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
            <input type="email" placeholder="Your email address"
              style={{ padding: "12px 18px", background: "#1a1a18", border: `1px solid ${border}`, borderRight: "none", color: text, fontFamily: FB, fontSize: 13, width: 260, outline: "none" }} />
            <button style={{
              padding: "12px 24px", background: gold, border: "none", borderRadius: "var(--lwd-radius-input)",
              color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.8px", textTransform: "uppercase", cursor: "pointer",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Subscribe</button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ fontFamily: FB, fontSize: 12, color: muted }}>
          © 2026 Luxury Wedding Directory Ltd. All rights reserved. Registered in England & Wales.
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy Policy", "Terms of Use", "Cookie Settings", "Sitemap"].map(l => (
            <a key={l} href="#" style={{ fontFamily: FB, fontSize: 12, color: muted, textDecoration: "none", transition: "color 0.18s" }}
              onMouseEnter={e => e.currentTarget.style.color = text}
              onMouseLeave={e => e.currentTarget.style.color = muted}
            >{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── FLOATING AURA CHAT ──────────────────────────────────────────────────────
function AuraChat({ venue }) {
  const C = useT();
  // mode: "closed" | "modal" | "full"
  const [mode, setMode] = useState("closed");
  const [msgs, setMsgs] = useState([
    { from: "aura", text: `Hi! I'm Aura, your LWD assistant. I know everything about ${venue.name} — pricing, spaces, availability and more. What would you like to know?` }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg) return;
    setMsgs(m => [...m, { from: "user", text: userMsg }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { from: "aura", text: `Great question! ${venue.name} would be delighted to help with that. I can share details here, or you can send a formal enquiry and the team will respond within ${venue.responseTime}.` }]);
    }, 1100);
  };

  const CHIPS = ["Ceremony spaces", "Guest capacity", "Exclusive use", "Pricing & availability"];
  const TOPICS = [
    { iconName: "museum", label: "The Venue" },
    { iconName: "wine", label: "Catering & Drink" },
    { iconName: "spa", label: "Accommodation" },
    { iconName: "airport", label: "Getting Here" },
    { iconName: "dining", label: "Pricing" },
    { iconName: "check", label: "Planning Help" },
  ];

  // ── Shared: message bubbles ───────────────────────────────────────────────
  const bubbles = () => (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {msgs.map((m, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start" }}>
          {m.from === "aura" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#fff",
              }}>✦</div>
              <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.03em" }}>Aura</span>
            </div>
          )}
          <div style={{
            maxWidth: "82%",
            background: m.from === "user"
              ? `linear-gradient(135deg, ${C.gold}, ${C.green})`
              : C.bgAlt,
            color: m.from === "user" ? "#fff" : C.text,
            padding: "11px 16px",
            fontFamily: FB, fontSize: 14, lineHeight: 1.65,
            borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
            boxShadow: m.from === "user" ? `0 2px 12px rgba(157,135,62,0.25)` : C.shadow,
          }}>{m.text}</div>
        </div>
      ))}
      {typing && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "#fff", flexShrink: 0, marginTop: 2,
          }}>✦</div>
          <div style={{ background: C.bgAlt, padding: "13px 16px", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%", background: C.textMuted,
                animation: `dotPulse 1.4s ease ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}
      <div ref={msgEndRef} />
    </div>
  );

  // ── Shared: input bar ─────────────────────────────────────────────────────
  const inputBar = (size = "normal") => (
    <div style={{
      padding: size === "large" ? "16px 24px" : "12px 16px",
      borderTop: `1px solid ${C.border}`,
      display: "flex", gap: 8,
    }}>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && send()}
        placeholder="Ask about spaces, pricing, availability…"
        autoFocus
        style={{
          flex: 1, padding: size === "large" ? "13px 18px" : "10px 14px",
          border: `1px solid ${C.border2}`, borderRadius: size === "large" ? 12 : 10,
          background: C.bgAlt, color: C.text,
          fontFamily: FB, fontSize: size === "large" ? 14 : 13,
          outline: "none", transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = C.border2}
      />
      <button onClick={() => send()} style={{
        width: size === "large" ? 46 : 40, height: size === "large" ? 46 : 40,
        background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
        border: "none", borderRadius: size === "large" ? 12 : 10,
        color: "#fff", fontSize: size === "large" ? 18 : 16,
        cursor: "pointer", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 10px rgba(157,135,62,0.3)`,
      }}>→</button>
    </div>
  );

  // ── Shared: WhatsApp strip ────────────────────────────────────────────────
  const waStrip = () => (
    <div style={{ padding: "9px 20px", borderTop: `1px solid ${C.border}` }}>
      <a href="https://wa.me/390558200700" target="_blank" rel="noopener noreferrer" style={{
        display: "flex", alignItems: "center", gap: 7,
        fontFamily: FB, fontSize: 12, color: C.green, textDecoration: "none", fontWeight: 600,
      }}>
        <span style={{ fontSize: 14 }}>💬</span>
        Prefer WhatsApp? Chat with {venue.owner?.name?.split(" ")[0]} directly →
      </a>
    </div>
  );

  return (
    <>
      {/* ── 1. CENTERED BAR TRIGGER ─────────────────────────────────────── */}
      {mode === "closed" && (
        <button
          className="lwd-aura-bar"
          onClick={() => setMode("modal")}
          style={{
            position: "fixed", left: 0, right: 0, margin: "0 auto",
            zIndex: 80,
            display: "flex", alignItems: "center", gap: 12,
            height: 54, paddingLeft: 7, paddingRight: 18,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid rgba(201,168,76,0.35)`,
            borderRadius: 27,
            boxShadow: `0 4px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(201,168,76,0.18)`,
            cursor: "pointer",
            width: 460, maxWidth: "calc(100vw - 32px)",
            transition: "box-shadow 0.25s, transform 0.25s",
            animation: "barPulse 3s ease-in-out infinite, fadeUp 0.5s ease both",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = `0 8px 48px rgba(0,0,0,0.12), 0 0 0 1.5px ${C.gold}`;
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.animation = "none";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = `0 4px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(201,168,76,0.18)`;
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.animation = "barPulse 3s ease-in-out infinite";
          }}
        >
          {/* Aura icon */}
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, color: "#fff",
            boxShadow: `0 2px 10px rgba(157,135,62,0.35)`,
          }}>✦</div>

          {/* Label */}
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontFamily: FD, fontSize: 13, color: "#2a2315", letterSpacing: "0.02em", lineHeight: 1.2 }}>
              Ask Aura about {venue.name}
            </div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(0,0,0,0.42)", marginTop: 2 }}>
              AI-powered · Responds instantly
            </div>
          </div>

          {/* Status dot + arrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#4caf7d",
              boxShadow: "0 0 0 3px rgba(76,175,125,0.2)",
            }} />
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: C.goldLight, border: `1px solid ${C.goldBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.gold, fontSize: 14,
            }}>→</div>
          </div>
        </button>
      )}

      {/* ── BACKDROP (shared by modal + full) ───────────────────────────── */}
      {(mode === "modal" || mode === "full") && (
        <div
          onClick={() => setMode("closed")}
          style={{
            position: "fixed", inset: 0, zIndex: 140,
            background: "rgba(6,6,4,0.62)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            animation: "fadeIn 0.25s ease both",
          }}
        />
      )}

      {/* ── 2. CENTERED MODAL ───────────────────────────────────────────── */}
      {mode === "modal" && (
        <div style={{
          position: "fixed", zIndex: 150,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560, maxWidth: "calc(100vw - 24px)",
          maxHeight: "82vh",
          background: C.surface,
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 20,
          boxShadow: `0 40px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(157,135,62,0.12)`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "chatModalIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          {/* Shimmer accent top */}
          <div style={{
            height: 3,
            background: `linear-gradient(90deg, ${C.gold}, ${C.green}, ${C.gold})`,
            backgroundSize: "200% 100%",
            animation: "shimmer 3s linear infinite",
          }} />

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#fff",
              boxShadow: `0 2px 10px rgba(157,135,62,0.3)`,
            }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FD, fontSize: 16, color: C.text, letterSpacing: "0.02em" }}>Aura</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf7d", display: "inline-block" }} />
                LWD AI · Knows {venue.name}
              </div>
            </div>
            {/* Expand button */}
            <button
              onClick={e => { e.stopPropagation(); setMode("full"); }}
              title="Open full experience"
              style={{
                height: 34, padding: "0 12px",
                borderRadius: 8,
                background: C.goldLight, border: `1px solid ${C.goldBorder}`,
                color: C.gold, cursor: "pointer",
                fontFamily: FB, fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5,
                marginRight: 6, whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.color = C.gold; }}
            >
              <span style={{ fontSize: 14 }}>⤢</span> Full chat
            </button>
            <button
              onClick={e => { e.stopPropagation(); setMode("closed"); }}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.textMid, cursor: "pointer", fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgAlt; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >✕</button>
          </div>

          {/* Quick-reply chips */}
          <div style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", flexWrap: "wrap", gap: 7,
          }}>
            {CHIPS.map(c => (
              <button
                key={c}
                onClick={e => { e.stopPropagation(); send(c); }}
                style={{
                  padding: "5px 13px", borderRadius: 20,
                  border: `1px solid ${C.goldBorder}`,
                  background: C.goldLight,
                  color: C.gold, fontFamily: FB, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.goldBorder; }}
              >{c}</button>
            ))}
          </div>

          {/* Messages */}
          {bubbles()}

          {/* WhatsApp */}
          {waStrip()}

          {/* Input */}
          {inputBar("normal")}
        </div>
      )}

      {/* ── 3. FULL SCREEN EXPERIENCE ───────────────────────────────────── */}
      {mode === "full" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex",
          animation: "fadeIn 0.2s ease both",
        }}>
          {/* ── Left sidebar ─── */}
          <div style={{
            width: 260, flexShrink: 0,
            background: "#0c0c0a",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex", flexDirection: "column",
          }}>
            {/* LWD wordmark */}
            <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontFamily: FD, fontSize: 10, color: "#b8a05a", letterSpacing: "0.22em", textTransform: "uppercase", lineHeight: 1.6 }}>
                Luxury Wedding<br />Directory
              </div>
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #b8a05a, #8fa08c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: "#fff",
                }}>✦</div>
                <div>
                  <div style={{ fontFamily: FD, fontSize: 14, color: "#f5f2ec", letterSpacing: "0.04em" }}>Aura</div>
                  <div style={{ fontFamily: FB, fontSize: 10, color: "#4caf7d", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4caf7d", display: "inline-block" }} />
                    Online
                  </div>
                </div>
              </div>
            </div>

            {/* Back to venue */}
            <button
              onClick={() => setMode("closed")}
              style={{
                margin: "14px 14px 6px",
                padding: "9px 14px",
                background: "rgba(184,160,90,0.07)",
                border: "1px solid rgba(184,160,90,0.2)",
                borderRadius: 10,
                color: "#b8a05a", fontFamily: FB, fontSize: 12, fontWeight: 600,
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 7,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(184,160,90,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(184,160,90,0.07)"}
            >
              ← Back to {venue.name}
            </button>

            {/* Topic links */}
            <div style={{ padding: "18px 14px 8px" }}>
              <div style={{
                fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10,
              }}>Ask about</div>
              {TOPICS.map(t => (
                <button
                  key={t.label}
                  onClick={() => send(t.label)}
                  style={{
                    width: "100%", padding: "9px 12px", marginBottom: 2,
                    background: "transparent", border: "none",
                    color: "rgba(255,255,255,0.6)", fontFamily: FB, fontSize: 13,
                    cursor: "pointer", textAlign: "left", borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,160,90,0.1)"; e.currentTarget.style.color = "#b8a05a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                >
                  <Icon name={t.iconName} size={15} color="currentColor" /> {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            {/* WhatsApp bottom */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <a href="https://wa.me/390558200700" target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: FB, fontSize: 12, color: "#8fa08c",
                textDecoration: "none", fontWeight: 600,
              }}>
                <span style={{ fontSize: 14 }}>💬</span>
                WhatsApp {venue.owner?.name?.split(" ")[0]}
              </a>
            </div>
          </div>

          {/* ── Right: main chat ─── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.surface, overflow: "hidden" }}>
            {/* Shimmer top */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, ${C.gold}, ${C.green}, ${C.gold})`,
              backgroundSize: "200% 100%",
              animation: "shimmer 3s linear infinite",
              flexShrink: 0,
            }} />

            {/* Header */}
            <div style={{
              padding: "18px 28px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: FD, fontSize: 20, color: C.text, letterSpacing: "0.02em" }}>
                  Chat with Aura
                </div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  AI assistant for {venue.name} · {venue.location}
                </div>
              </div>
              <button
                onClick={() => setMode("closed")}
                style={{
                  width: 38, height: 38, borderRadius: 9,
                  background: "transparent", border: `1px solid ${C.border}`,
                  color: C.textMid, cursor: "pointer", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >✕</button>
            </div>

            {/* Messages */}
            {bubbles()}

            {/* Input */}
            {inputBar("large")}
          </div>
        </div>
      )}
    </>
  );
}

// ─── COOKIE BANNER (standalone — no ChatContext dependency) ──────────────────
const COOKIE_KEY = "lwd_cookies_accepted";
function VenueCookieBanner() {
  const C = useT();
  const [visible, setVisible]   = useState(false);
  const [entered, setEntered]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      const t = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ all: true, ts: Date.now() }));
    setEntered(false);
    setTimeout(() => setVisible(false), 350);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ essential: true, ts: Date.now() }));
    setEntered(false);
    setTimeout(() => setVisible(false), 350);
  };

  if (!visible) return null;

  return (
    <div style={{
      position:   "fixed",
      bottom:      0,
      left:        0,
      right:       0,
      zIndex:      1500,
      background:  "#0D0B09",
      borderTop:  "1px solid rgba(201,168,76,0.2)",
      padding:    "14px 28px",
      fontFamily:  FB,
      transform:   entered ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      boxShadow:  "0 -4px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
      }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#C9A84C", fontSize: 15 }}>✦</span> We use cookies
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, margin: 0 }}>
            We use essential cookies to make our site work, and optional cookies to personalise your experience. By clicking{" "}
            <strong style={{ color: "rgba(255,255,255,0.65)" }}>Accept All</strong>, you agree to our use of cookies.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
          <button onClick={decline} style={{
            background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
            color: "rgba(255,255,255,0.55)", padding: "9px 18px",
            fontFamily: FB, fontSize: 11, cursor: "pointer", letterSpacing: "0.5px",
            transition: "all 0.2s", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
          >Essential Only</button>
          <button onClick={accept} style={{
            background: "#C9A84C", border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#0D0B09", padding: "9px 24px",
            fontFamily: FB, fontSize: 11, fontWeight: 700, cursor: "pointer",
            letterSpacing: "1.5px", textTransform: "uppercase", transition: "opacity 0.2s",
            whiteSpace: "nowrap",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Accept All</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function VenueProfile({ onBack = null }) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [saved, setSaved] = useState(false);
  const [lightIdx, setLightIdx] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [heroStyle, setHeroStyle] = useState("cinematic");
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const C = darkMode ? DARK : LIGHT;

  // Record this venue visit for Recently Viewed tracking
  useEffect(() => { recordVenueView(VENUE); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveTab(e.target.id);
        });
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );
    TABS.forEach(t => {
      const el = document.getElementById(t.key);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (key) => {
    setActiveTab(key);
    const el = document.getElementById(key);
    if (el) {
      const offset = 110; // nav height + tab bar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const addCompare = () => {
    if (!compareList.find(v => v.id === VENUE.id)) {
      setCompareList(l => [...l, { id: VENUE.id, name: VENUE.name }]);
    }
  };

  return (
    <Theme.Provider value={C}>
      <GlobalStyles />
      <div className="vp-root" style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
        <Nav darkMode={darkMode} setDarkMode={setDarkMode} saved={saved} setSaved={setSaved} compareList={compareList} onAddCompare={addCompare} onBack={onBack} />
        <Hero venue={VENUE} heroStyle={heroStyle} setHeroStyle={setHeroStyle} onEnquire={() => setEnquiryOpen(true)} />
        <StatsStrip venue={VENUE} />
        <StickyTabNav venue={VENUE} activeTab={activeTab} onTabClick={scrollToSection} />

        {/* Main layout */}
        <div className="vp-main-wrapper" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 40px 120px" }}>
          <div className="vp-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 56, alignItems: "start" }}>
            {/* Content — Luxury venue reading journey: story → experience → logistics → validation */}
            <div>
              {/* 1. Introduction & context */}
              <AboutSection venue={VENUE} />

              {/* 2. The celebration — where guests stay & what they do */}
              <RoomsSection venue={VENUE} />
              <WeddingWeekend venue={VENUE} />

              {/* 3. The experience — dining & activities */}
              <DiningSection venue={VENUE} />
              <CateringSection venue={VENUE} />
              <ExperiencesDisplay venue={VENUE} />

              {/* 4. Logistics — how to get there & stay in touch */}
              <GettingHere access={VENUE.access} />
              <ContactSection venue={VENUE} />

              {/* 5. Visual & contextual */}
              <ExclusiveUse venue={VENUE} onEnquire={() => setEnquiryOpen(true)} />
              <VenueTypeSection venue={VENUE} />

              {/* 6. Visual proof — gallery after the narrative is complete */}
              <ImageGallery gallery={VENUE.gallery} onOpenLight={i => setLightIdx(i)} />
              <VideoGallery videos={VENUE.videos} />

              {/* 7. Social proof & support */}
              <Reviews testimonials={VENUE.testimonials} venue={VENUE} />
              <FAQSection venue={VENUE} onAsk={() => setEnquiryOpen(true)} />

              {/* 8. Further recommendations */}
              <SimilarVenues venue={VENUE} />
              <RecentlyViewed venue={VENUE} />
            </div>
            {/* Sidebar — 4 zones, sticky on desktop */}
            <div className="lwd-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 56, alignSelf: "start" }}>
              {/* Zone 1 — Owner card */}
              <OwnerCard owner={VENUE.owner} venue={VENUE} />
              {/* Zone 2 — Lead form (scrolls naturally) */}
              <LeadForm venue={VENUE} />
              {/* Zone 3 — Mini map + quick contact */}
              <SidebarContact venue={VENUE} />
              {/* Zone 4 — Venue notices (open days, offers, late availability, news) */}
              <SidebarNotices notices={VENUE.notices} venueName={VENUE.name} />
              {/* Zone 5 — Instagram teaser (placeholder — to be connected to live feed) */}
              {/* <SidebarInstagram venue={VENUE} /> */}
            </div>
          </div>
        </div>

        <Footer />
        <MobileLeadBar venue={VENUE} />
        <CompareBar items={compareList} onRemove={id => setCompareList(l => l.filter(v => v.id !== id))} onClear={() => setCompareList([])} />
        <Lightbox gallery={VENUE.gallery} idx={lightIdx} setLightIdx={setLightIdx} onClose={() => setLightIdx(null)} onPrev={() => setLightIdx(i => (i - 1 + VENUE.gallery.length) % VENUE.gallery.length)} onNext={() => setLightIdx(i => (i + 1) % VENUE.gallery.length)} engagement={VENUE.engagement?.photos} />
        {enquiryOpen && <EnquiryModal venue={VENUE} onClose={() => setEnquiryOpen(false)} />}
        <VenueCookieBanner />
      </div>
    </Theme.Provider>
  );
}
