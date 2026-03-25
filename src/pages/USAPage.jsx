// ─── src/pages/USAPage.jsx ───────────────────────────────────────────────────
// United States country hub — a snapshot of getting married in America.
// Full luxury editorial page matching Italy CategoryPage quality.
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";
import { STYLES, CAPS, PRICES, DEFAULT_FILTERS } from "../data/italyVenues";
import { fetchListings } from "../services/listings";

import HomeNav from "../components/nav/HomeNav";
import SiteFooter from "../components/sections/SiteFooter";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import MapSection from "../components/sections/MapSection";
import GCard from "../components/cards/GCard";
import GCardMobile from "../components/cards/GCardMobile";
import QuickViewModal from "../components/modals/QuickViewModal";
import SliderNav from "../components/ui/SliderNav";
import "../category.css";

// ── Font tokens ──────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Slugify helper ───────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/['']/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Hero images ──────────────────────────────────────────────────────────────
const HERO_IMGS = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=960&q=80",
  "https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=960&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=960&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=960&q=80",
];

// ══════════════════════════════════════════════════════════════════════════════
// DUMMY USA VENUE DATA (10 venues)
// ══════════════════════════════════════════════════════════════════════════════
const USA_VENUES = [
  { id:101, name:"The Estate at Oheka Castle", region:"New York", city:"Huntington",
    countrySlug:"usa", regionSlug:"new-york", lat:40.8107, lng:-73.4265, online:true,
    styles:["Black Tie","Historic","Garden"], capacity:300, priceLabel:"££££", priceFrom:"$25,000",
    rating:4.9, reviews:187, featured:true, verified:true, lwdScore:96, tag:"Estate of the Year",
    desc:"A Gold Coast mansion set on 443 acres of manicured formal gardens. Modelled after the grand chateaux of France, this Gatsby-era estate offers unparalleled grandeur.",
    includes:["Exclusive Use","Private Gardens","22 Bedrooms","Grand Ballroom","In-House Chef"],
    imgs:["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=900&q=80"] },
  { id:102, name:"Meadowood Napa Valley", region:"California", city:"St. Helena",
    countrySlug:"usa", regionSlug:"napa-valley", lat:38.5101, lng:-122.4847, online:true,
    styles:["Garden","Elegant","Vineyard"], capacity:150, priceLabel:"££££", priceFrom:"$30,000",
    rating:5.0, reviews:94, featured:true, verified:true, lwdScore:97, tag:"Most Romantic",
    desc:"Nestled among 250 acres of Napa hillside, Meadowood offers an intimate wine-country sanctuary where ceremonies unfold beneath century-old oaks.",
    includes:["Private Vineyard","Michelin Dining","Spa Access","Estate Grounds","Concierge"],
    imgs:["https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },
  { id:103, name:"The Breakers Palm Beach", region:"Florida", city:"Palm Beach",
    countrySlug:"usa", regionSlug:"palm-beach", lat:26.7135, lng:-80.0364, online:true,
    styles:["Black Tie","Coastal","Classic"], capacity:500, priceLabel:"££££", priceFrom:"$35,000",
    rating:4.8, reviews:312, featured:true, verified:true, lwdScore:94, tag:"Iconic Landmark",
    desc:"An Italian Renaissance palace overlooking the Atlantic. Since 1896, The Breakers has been America's most storied oceanfront resort.",
    includes:["Ocean Views","Grand Ballroom","Private Beach","12 Restaurants","Spa"],
    imgs:["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80"] },
  { id:104, name:"Montage Deer Valley", region:"Utah", city:"Park City",
    countrySlug:"usa", regionSlug:"park-city", lat:40.6244, lng:-111.4978, online:true,
    styles:["Mountain","Rustic Luxe","Elegant"], capacity:200, priceLabel:"£££", priceFrom:"$18,000",
    rating:4.9, reviews:156, featured:true, verified:true, lwdScore:92, tag:"Mountain Retreat",
    desc:"Perched at 9,100 feet in the Wasatch Mountains with world-class cuisine, ski-in access, and panoramic mountain vistas.",
    includes:["Mountain Views","Ski Access","Spa","Private Dining","Helipad"],
    imgs:["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80"] },
  { id:105, name:"San Ysidro Ranch", region:"California", city:"Santa Barbara",
    countrySlug:"usa", regionSlug:"santa-barbara", lat:34.4523, lng:-119.6303, online:true,
    styles:["Garden","Romantic","Cottage"], capacity:100, priceLabel:"££££", priceFrom:"$28,000",
    rating:5.0, reviews:78, featured:true, verified:true, lwdScore:98, tag:"Celebrity Favourite",
    desc:"A secluded 500-acre hideaway where JFK and Jackie honeymooned. The California coast meets old-world romance.",
    includes:["Private Cottages","Ocean Views","Garden Ceremonies","Chef's Table","Exclusive Use"],
    imgs:["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80"] },
  { id:106, name:"The Biltmore Estate", region:"North Carolina", city:"Asheville",
    countrySlug:"usa", regionSlug:"north-carolina", lat:35.5438, lng:-82.5515, online:true,
    styles:["Historic","Black Tie","Garden"], capacity:400, priceLabel:"£££", priceFrom:"$15,000",
    rating:4.8, reviews:234, featured:false, verified:true, lwdScore:89,
    desc:"America's largest privately owned estate — 8,000 acres of Blue Ridge Mountain beauty surrounding a French Renaissance chateau.",
    includes:["250 Room Chateau","Award-Winning Gardens","Winery","Private Tours","Exclusive Use"],
    imgs:["https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1467951591042-f388365db261?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80"] },
  { id:107, name:"The Little Nell", region:"Colorado", city:"Aspen",
    countrySlug:"usa", regionSlug:"aspen", lat:39.1869, lng:-106.8181, online:true,
    styles:["Mountain","Elegant","Ski"], capacity:120, priceLabel:"££££", priceFrom:"$22,000",
    rating:4.9, reviews:109, featured:false, verified:true, lwdScore:91,
    desc:"The only ski-in, ski-out five-star hotel in Aspen. Intimate mountain celebrations with panoramic views of Ajax Mountain.",
    includes:["Ski-In Access","Rooftop Terrace","Wine Cellar","Private Dining","Spa"],
    imgs:["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80"] },
  { id:108, name:"Wianno Club", region:"Massachusetts", city:"Cape Cod",
    countrySlug:"usa", regionSlug:"cape-cod", lat:41.6232, lng:-70.3911, online:true,
    styles:["Coastal","Classic","Garden"], capacity:180, priceLabel:"£££", priceFrom:"$12,000",
    rating:4.7, reviews:67, featured:false, verified:true, lwdScore:85,
    desc:"An exclusive Cape Cod institution since 1916. Celebrations unfold on the waterfront terrace with Nantucket Sound as a backdrop.",
    includes:["Waterfront Terrace","Private Beach","Ballroom","Golf Course","Harbour Access"],
    imgs:["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=900&q=80"] },
  { id:109, name:"Four Seasons Resort Hualalai", region:"Hawaii", city:"Kailua-Kona",
    countrySlug:"usa", regionSlug:"hawaii", lat:19.9225, lng:-155.8750, online:true,
    styles:["Coastal","Romantic","Garden"], capacity:250, priceLabel:"££££", priceFrom:"$40,000",
    rating:4.9, reviews:201, featured:false, verified:true, lwdScore:93,
    desc:"A private oceanfront sanctuary on the Kohala Coast. Lava-rock gardens, white-sand ceremonies, and Pacific sunsets define this Hawaiian paradise.",
    includes:["Private Beach","Ocean Lawn","Cultural Programme","Spa","Golf"],
    imgs:["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80"] },
  { id:110, name:"Hotel Bel-Air", region:"California", city:"Los Angeles",
    countrySlug:"usa", regionSlug:"los-angeles", lat:34.0821, lng:-118.4497, online:true,
    styles:["Garden","Elegant","Romantic"], capacity:130, priceLabel:"££££", priceFrom:"$32,000",
    rating:5.0, reviews:144, featured:false, verified:true, lwdScore:95,
    desc:"A hidden oasis in Stone Canyon, surrounded by 12 acres of lush gardens and a swan lake. Hollywood's most discreet luxury wedding address.",
    includes:["Swan Lake","Private Gardens","Wolfgang Puck Dining","Spa","Exclusive Use"],
    imgs:["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80"] },
];

// ══════════════════════════════════════════════════════════════════════════════
// DUMMY USA VENDOR DATA (6 vendors)
// ══════════════════════════════════════════════════════════════════════════════
const USA_VENDORS = [
  { id:"vdr-usa-1", type:"vendor", category:"planner", name:"Sterling & Grace Events",
    region:"New York", city:"New York City", countrySlug:"usa", regionSlug:"new-york",
    lat:40.7580, lng:-73.9855, online:true, rating:4.9, reviews:132,
    priceLabel:"££££", priceFrom:"$15,000", verified:true, lwdScore:95, tag:"Top Planner",
    desc:"White-glove wedding planning for discerning couples. From Hamptons estates to Manhattan penthouses, Sterling & Grace orchestrate celebrations of extraordinary precision.",
    styles:["Wedding Planner"], specialties:["Full Planning","Destination","Luxury Coordination"],
    includes:["Full Planning","Destination","Luxury Coordination"],
    imgs:["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
  { id:"vdr-usa-2", type:"vendor", category:"photographer", name:"Ari Aravot Photography",
    region:"California", city:"Los Angeles", countrySlug:"usa", regionSlug:"los-angeles",
    lat:34.0522, lng:-118.2437, online:true, rating:5.0, reviews:89,
    priceLabel:"££££", priceFrom:"$8,000", verified:true, lwdScore:97, tag:"Editor's Pick",
    desc:"Fine-art wedding photography with a cinematic sensibility. Published in Vogue, Harper's Bazaar, and Martha Stewart Weddings.",
    styles:["Photographer"], specialties:["Fine Art","Editorial","Film"],
    includes:["Fine Art","Editorial","Film"],
    imgs:["https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80"] },
  { id:"vdr-usa-3", type:"vendor", category:"florist", name:"Putnam & Putnam",
    region:"New York", city:"New York City", countrySlug:"usa", regionSlug:"new-york",
    lat:40.7282, lng:-73.7949, online:true, rating:4.8, reviews:76,
    priceLabel:"££££", priceFrom:"$12,000", verified:true, lwdScore:93,
    desc:"Botanical artistry for the world's most discerning celebrations. Known for lush, sculptural installations that transform spaces into living gardens.",
    styles:["Florist"], specialties:["Installations","Garden Style","Sculptural"],
    includes:["Installations","Garden Style","Sculptural"],
    imgs:["https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?auto=format&fit=crop&w=900&q=80"] },
  { id:"vdr-usa-4", type:"vendor", category:"caterer", name:"Peter Callahan Catering",
    region:"New York", city:"New York City", countrySlug:"usa", regionSlug:"new-york",
    lat:40.7484, lng:-73.9857, online:true, rating:4.9, reviews:108,
    priceLabel:"££££", priceFrom:"$180 pp", verified:true, lwdScore:91,
    desc:"Inventive, show-stopping cuisine for black-tie celebrations. Famous for miniature culinary masterpieces and theatrical presentations.",
    styles:["Caterer"], specialties:["Tasting Menus","Cocktail Events","Chef's Table"],
    includes:["Tasting Menus","Cocktail Events","Chef's Table"],
    imgs:["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"] },
  { id:"vdr-usa-5", type:"vendor", category:"musician", name:"Hank Lane Music",
    region:"New York", city:"New York City", countrySlug:"usa", regionSlug:"new-york",
    lat:40.7614, lng:-73.9776, online:true, rating:4.8, reviews:215,
    priceLabel:"£££", priceFrom:"$5,000", verified:true, lwdScore:88,
    desc:"New York's premier society orchestra since 1968. From jazz quartets to 16-piece big bands, Hank Lane sets the tone for America's finest celebrations.",
    styles:["Musician"], specialties:["Live Bands","Jazz Ensemble","String Quartet"],
    includes:["Live Bands","Jazz Ensemble","String Quartet"],
    imgs:["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80"] },
  { id:"vdr-usa-6", type:"vendor", category:"planner", name:"Easton Events",
    region:"Virginia", city:"Charlottesville", countrySlug:"usa", regionSlug:"virginia",
    lat:38.0293, lng:-78.4767, online:true, rating:5.0, reviews:91,
    priceLabel:"££££", priceFrom:"$20,000", verified:true, lwdScore:96, tag:"Southern Icon",
    desc:"Luxury destination wedding planning rooted in Southern hospitality. Specialising in estate weddings from Virginia to the Carolinas and beyond.",
    styles:["Wedding Planner"], specialties:["Estate Weddings","Destination","Southern Style"],
    includes:["Estate Weddings","Destination","Southern Style"],
    imgs:["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"] },
];

const FEATURED = USA_VENUES.filter((v) => v.featured);
const LATEST_5 = USA_VENUES.slice(0, 5);

// ── Curated destination columns ──────────────────────────────────────────────
const CURATED = [
  { title: "Northeast",  items: ["New York","The Hamptons","Hudson Valley","Martha's Vineyard","Cape Cod","Connecticut","Vermont","Maine"] },
  { title: "Southeast",  items: ["Florida","Palm Beach","Miami","Charleston","Savannah","Nashville","New Orleans","Puerto Rico"] },
  { title: "West Coast",  items: ["California","Napa Valley","Los Angeles","San Francisco","Big Sur","Santa Barbara","Lake Tahoe","Hawaii"] },
  { title: "Mountain & Central", items: ["Aspen","Scottsdale","Sedona","Jackson Hole","Park City","Austin","Chicago","Dallas"] },
];

// ── All 50 US states (alphabetical) ─────────────────────────────────────────
const ALL_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

// ── Info strip data ──────────────────────────────────────────────────────────
const INFO_COLS = [
  { label: "Destinations", items: ["New York","Napa Valley","Palm Beach","Aspen","Santa Barbara","Charleston","Hawaii"] },
  { label: "Signature Vibe", items: ["Estate Grandeur","Wine Country","Coastal Elegance","Mountain Retreat","Southern Charm"] },
  { label: "Elite Services", items: ["Private Estate Hire","Vineyard Ceremonies","Celebrity Chef Dining","Helicopter Transfers","Dedicated Concierge"] },
];

// ── FAQ data ─────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "When is the best time to get married in the US?", a: "The most popular months are May through October, though the ideal season varies by region. Southern California and Hawaii offer year-round possibilities, while New England autumns and Aspen winters create uniquely dramatic settings." },
  { q: "What is the average cost of a luxury US wedding?", a: "Luxury celebrations in the United States typically range from $50,000 to $300,000 or more, depending on the venue, guest count, and level of personalisation. Major metropolitan areas and resort destinations command premium pricing." },
  { q: "How far in advance should I book a US venue?", a: "For premier venues, we recommend securing your date 12 to 18 months in advance. The most sought-after estates in the Hamptons, Napa Valley, and Palm Beach often book two years ahead for peak-season weekends." },
  { q: "Do I need a wedding planner for a destination US wedding?", a: "While not required, a luxury wedding planner with regional expertise is strongly recommended. They navigate local permitting, vendor relationships, and logistics, ensuring a seamless celebration." },
];

// ── USA "regions" for FilterBar mega menu ────────────────────────────────────
const USA_REGIONS = [
  { slug: "all", name: "All Destinations" },
  { slug: "new-york", name: "New York", priorityLevel: "primary" },
  { slug: "california", name: "California", priorityLevel: "primary" },
  { slug: "florida", name: "Florida", priorityLevel: "primary" },
  { slug: "hawaii", name: "Hawaii", priorityLevel: "primary" },
  { slug: "colorado", name: "Colorado", priorityLevel: "secondary" },
  { slug: "utah", name: "Utah", priorityLevel: "secondary" },
  { slug: "north-carolina", name: "North Carolina", priorityLevel: "secondary" },
  { slug: "massachusetts", name: "Massachusetts", priorityLevel: "secondary" },
  { slug: "virginia", name: "Virginia", priorityLevel: "secondary" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function toColumns(arr, n) {
  const size = Math.ceil(arr.length / n);
  return Array.from({ length: n }, (_, i) => arr.slice(i * size, (i + 1) * size));
}
function matchesCapacity(v, cap) {
  if (cap === CAPS[0]) return true;
  // Support both static (capacity) and DB (capacityMax / capacity_max) fields
  const cap_val = v.capacity || v.capacityMax || v.capacity_max || 0;
  if (cap === CAPS[1]) return cap_val <= 50;
  if (cap === CAPS[2]) return cap_val > 50 && cap_val <= 100;
  if (cap === CAPS[3]) return cap_val > 100 && cap_val <= 200;
  if (cap === CAPS[4]) return cap_val > 200;
  return true;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Mobile detection hook ─────────────────────────────────────────────────
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

export default function USAPage({
  onBack = () => {},
  onViewVenue = () => {},
  onViewRegion = () => {},
  onViewCategory = () => {},
  onViewStandard,
  onViewAbout,
  footerNav = {},
}) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const isMobile = useIsMobile();
  const C = darkMode ? getDarkPalette() : getLightPalette();
  const { setChatContext } = useChat();

  // DB venues
  const [dbVenues, setDbVenues] = useState([]);

  // Filters
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState("grid");
  const [sortMode, setSortMode] = useState("recommended");
  const [searchQuery, setSearchQuery] = useState("");

  // Slider
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideFade, setSlideFade] = useState(true);
  const slideTimer = useRef(null);

  // UI
  const [openFaq, setOpenFaq] = useState(null);
  const [hovImg, setHovImg] = useState(null);
  const [hovConsult, setHovConsult] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [qvItem, setQvItem] = useState(null);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => { setChatContext?.({ page: "usa", country: "USA" }); }, [setChatContext]);

  // ── Fetch venues from DB ───────────────────────────────────────────────────
  useEffect(() => {
    fetchListings({ listing_type: "venue", country_slug: "usa", status: "published" })
      .then((d) => setDbVenues(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // ── Hero image auto-advance ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((p) => (p + 1) % HERO_IMGS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // ── SEO: /usa is an indexable country entity ──────────────────────────────
  useEffect(() => {
    // Ensure no stale noindex from template pages
    const staleRobots = document.querySelector('meta[name="robots"]');
    if (staleRobots) staleRobots.remove();

    // Canonical — this IS the canonical URL
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", "https://luxuryweddingdirectory.com/usa");

    return () => { canon.remove(); };
  }, []);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── Slider auto-advance ────────────────────────────────────────────────────
  const goSlide = useCallback((i) => {
    setSlideFade(false);
    setTimeout(() => { setSlideIdx(i); setSlideFade(true); }, 350);
  }, []);
  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setSlideFade(false);
      setTimeout(() => { setSlideIdx((p) => (p + 1) % FEATURED.length); setSlideFade(true); }, 350);
    }, 5500);
    return () => clearInterval(slideTimer.current);
  }, []);

  // ── Merge DB + static venues (DB takes priority when available) ───────────
  const allVenues = useMemo(
    () => (dbVenues.length > 0 ? dbVenues : USA_VENUES),
    [dbVenues]
  );

  // ── Stable map slice (avoids effect restarts on every render) ─────────────
  const mapVenues = useMemo(() => allVenues.slice(0, 40), [allVenues]);

  // ── Filter + sort venues ───────────────────────────────────────────────────
  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = allVenues.filter((v) => {
      const rOk = filters.region === "all" || v.regionSlug === filters.region;
      const vStyles = Array.isArray(v.styles) ? v.styles : [];
      const sOk = filters.style === STYLES[0] || vStyles.includes(filters.style);
      const vPrice = v.priceLabel || v.price_label || "";
      const pOk = filters.price === PRICES[0] || vPrice === filters.price;
      const cOk = matchesCapacity(v, filters.capacity);
      const vName = (v.name || v.venueName || "").toLowerCase();
      const vDesc = (v.desc || v.description || v.summary || "").toLowerCase();
      const qOk = !q || vName.includes(q) || vDesc.includes(q) || (v.city || "").toLowerCase().includes(q) || (v.region || "").toLowerCase().includes(q);
      return rOk && sOk && pOk && cOk && qOk;
    });
    if (sortMode === "recommended") result = [...result].sort((a, b) => (b.lwdScore || b.lwd_score || 0) - (a.lwdScore || a.lwd_score || 0));
    else if (sortMode === "rating") result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return result;
  }, [allVenues, filters, sortMode, searchQuery]);

  const toggleSave = useCallback((id) => setSavedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]), []);

  const stateCols = toColumns(ALL_STATES, 5);
  const cur = FEATURED[slideIdx] || FEATURED[0];

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>
        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <HomeNav darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} onNavigateStandard={onViewStandard} onNavigateAbout={onViewAbout} />

        <main>
          {/* ═══ 1. HERO (72vh) — full-width image slider ══════════════════ */}
          <section style={{ position: "relative", height: "72vh", minHeight: 580, overflow: "hidden", background: "#0a0806" }}>
            {/* Gold shimmer bar */}
            <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 10, background: "linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

            {/* Full-width sliding background images */}
            {HERO_IMGS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: heroIdx === i ? 0.7 : 0,
                  transform: heroIdx === i ? "scale(1.04)" : "scale(1)",
                  transition: "opacity 1.2s ease, transform 8s ease",
                }}
              />
            ))}

            {/* Gradient overlays — lighter to let images breathe */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,8,6,0.25) 0%, rgba(10,8,6,0.7) 100%)" }} />
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,8,6,0.55) 0%, transparent 60%)" }} />

            {/* Text content — always-dark section, hardcoded colours */}
            <div className="usa-hero-content" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 80px 80px", zIndex: 2, opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)", transition: "all 0.9s ease" }}>
              {/* Category label with gold ornament line */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }} aria-hidden="true">
                <div style={{ width: 32, height: 1, background: "rgba(201,168,76,0.6)" }} />
                <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "rgba(201,168,76,0.9)", fontWeight: 600 }}>
                  Venues · United States
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: GD, fontSize: "clamp(44px, 6vw, 76px)", fontWeight: 400, color: "#fff", lineHeight: 1.05, margin: "0 0 18px", letterSpacing: "-0.5px", maxWidth: 700 }}>
                Weddings in <em style={{ fontStyle: "italic", color: "rgba(201,168,76,0.95)" }}>America</em>
              </h1>

              {/* Tagline */}
              <p style={{ fontFamily: NU, fontSize: 16, color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.6, maxWidth: 520, margin: "0 0 20px" }}>
                Discover {filteredVenues.length} extraordinary venues and world-class wedding professionals across the
                United States — from Gatsby-era estates to sun-drenched coastal retreats.
              </p>

              {/* Trust line — gold uppercase matching Italy */}
              <p style={{ fontFamily: NU, fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(201,168,76,0.7)", fontWeight: 500, margin: "0 0 36px" }}>
                Each venue personally vetted · No paid placements
              </p>

              {/* Stats row */}
              <div className="lwd-hero-stats" style={{ display: "flex", gap: 32, alignItems: "center" }} aria-label="Key statistics">
                {[
                  { val: String(USA_VENUES.length), label: "Curated Venues" },
                  { val: "50", label: "States Covered" },
                  { val: "100%", label: "Personally Verified" },
                  { val: "—", label: "Limited Annual Availability" },
                ].map((s, i) => (
                  <div key={i} style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none", paddingLeft: i > 0 ? 32 : 0 }}>
                    <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 600, color: "#C9A84C", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div aria-hidden="true" style={{ position: "absolute", bottom: 24, right: 48, display: "flex", alignItems: "center", gap: 8, opacity: 0.5, zIndex: 3 }}>
              <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#fff" }}>Scroll</span>
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.4)" }} />
            </div>

            {/* Slide indicator dots */}
            <div style={{ position: "absolute", bottom: 28, left: 80, display: "flex", gap: 8, zIndex: 3 }}>
              {HERO_IMGS.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Slide ${i + 1}`} style={{ width: heroIdx === i ? 24 : 8, height: 2, borderRadius: 1, border: "none", cursor: "pointer", background: heroIdx === i ? "#C9A84C" : "rgba(255,255,255,0.3)", transition: "all 0.4s ease", padding: 0 }} />
              ))}
            </div>
          </section>

          {/* ═══ 2. INFO STRIP ════════════════════════════════════════════ */}
          <section className="usa-section" style={{ background: C.dark, borderTop: `1px solid ${C.border}`, padding: "40px 48px" }}>
            <div className="usa-info-strip" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {INFO_COLS.map((col, ci) => (
                <div key={col.label} style={{ padding: "0 28px", borderLeft: ci > 0 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 14 }}>
                    <span style={{ fontSize: 6, marginRight: 6, opacity: 0.5 }}>✦</span>{col.label}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {col.items.map((item) => (
                      <span key={item} style={{ fontFamily: NU, fontSize: 11, color: C.grey, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-input)", padding: "5px 12px", cursor: "default", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; }}
                      >{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ UNIFIED STICKY SEARCH BAR ═══════════════════════════════ */}
          <CountrySearchBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewMode={setViewMode}
            sortMode={sortMode}
            onSortChange={setSortMode}
            total={filteredVenues.length}
            regions={USA_REGIONS}
            onVendorSearch={(q) => onViewCategory?.({ searchQuery: q.location || q.category })}
            countryFilter="USA"
            mapContent={
              <MapSection
                venues={mapVenues}
                vendors={USA_VENDORS}
                countryFilter="USA"
              />
            }
          />

          {/* ═══ 3. BRIDGE ════════════════════════════════════════════════ */}
          <div className="usa-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 48px 0", textAlign: "center" }}>
            <p style={{ fontFamily: GD, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 300, fontStyle: "italic", color: C.grey, letterSpacing: "0.5px" }}>Choose your backdrop.</p>
          </div>

          {/* ═══ 4. EDITORIAL SPLIT ═══════════════════════════════════════ */}
          <section className="usa-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 48px 80px" }}>
            <div className="usa-split-grid" style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 40 }}>
              {/* Left — image mosaic */}
              <div className="usa-mosaic-grid" style={{ display: "grid", gap: 6, gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gridTemplateAreas: '"one two" "one three" "four five"', minHeight: 500 }}>
                {LATEST_5.map((v, i) => {
                  const areas = ["one","two","three","four","five"];
                  return (
                    <div key={v.id} style={{ gridArea: areas[i], position: "relative", borderRadius: "var(--lwd-radius-image)", overflow: "hidden", cursor: "pointer" }}
                      onMouseEnter={() => setHovImg(v.id)} onMouseLeave={() => setHovImg(null)}>
                      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${v.imgs[0]})`, backgroundSize: "cover", backgroundPosition: "center", transform: hovImg === v.id ? "scale(1.07)" : "scale(1)", transition: "transform 0.65s ease" }} />
                      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,${hovImg === v.id ? 0.2 : 0.1}) 0%, rgba(0,0,0,${hovImg === v.id ? 0.65 : 0.55}) 100%)`, transition: "background 0.5s" }} />
                      {i === 0 && <div style={{ position: "absolute", top: 14, left: 14, fontFamily: NU, fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "#fff", background: `${C.gold}dd`, padding: "4px 10px", borderRadius: 3, fontWeight: 700 }}>Latest</div>}
                      <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
                        <div style={{ fontFamily: GD, fontSize: i === 0 ? 20 : 15, color: "#fff", lineHeight: 1.2 }}>{v.name}</div>
                        <div style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{v.region}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Right — editorial */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 20 }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 14 }}>Why America</div>
                <div style={{ width: 48, height: 1, background: C.gold, opacity: 0.5, marginBottom: 22 }} />
                <h2 style={{ fontFamily: GD, fontSize: "clamp(24px,2.5vw,34px)", fontWeight: 400, color: C.off, lineHeight: 1.2, marginBottom: 18 }}>
                  The Complete Guide to <span style={{ fontStyle: "italic", color: C.gold }}>American Weddings</span>
                </h2>
                <p style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85, marginBottom: 14 }}>
                  From the grand estates of Long Island to the vineyard-draped hillsides of Napa Valley,
                  the United States offers a tapestry of wedding destinations as diverse as the country itself.
                  Our guide covers venues, planners, photographers, and every detail in between.
                </p>
                <p style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85, marginBottom: 28, opacity: 0.8 }}>
                  Whether you are planning an intimate coastal ceremony or a 500-guest estate celebration,
                  our curated collection ensures your day is as unforgettable as the setting.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
                  {[["🏛️","Historic estate venues"],["🍇","Private vineyard settings"],["🌴","Coastal & island retreats"],["⛷️","Mountain & ski resorts"]].map(([icon, text]) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{text}</span>
                    </div>
                  ))}
                </div>
                <button style={{ alignSelf: "flex-start", background: "none", border: `1px solid ${C.gold}66`, borderRadius: "var(--lwd-radius-input)", color: `${C.gold}cc`, padding: "12px 32px", fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.25s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = C.black; e.currentTarget.style.borderColor = C.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = `${C.gold}cc`; e.currentTarget.style.borderColor = `${C.gold}66`; }}
                >Browse All</button>
              </div>
            </div>
          </section>

          {/* ═══ 5. DIVIDER ═══════════════════════════════════════════════ */}
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
            <div style={{ height: 1, background: C.border }} />
          </div>

          {/* ═══ 6. LATEST VENUES (6 cards using GCard) ═══════════════════ */}
          <div className="usa-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 48px 8px" }}>
            <p style={{ fontFamily: GD, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 300, fontStyle: "italic", color: C.grey, letterSpacing: "0.5px", margin: "0 0 6px" }}>Latest Venues.</p>
            <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, opacity: 0.6, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
              Newly added estates, resorts, and private properties — each personally vetted by our editorial team.
            </p>
          </div>
          <div className="usa-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 48px 0" }}>
            <SliderNav className="usa-venue-grid" cardWidth={isMobile ? 300 : 340} gap={isMobile ? 12 : 16}>
              {filteredVenues.slice(0, isMobile ? 8 : 12).map((v) => (
                <div key={v.id} className="usa-venue-card" style={{ flex: isMobile ? "0 0 300px" : "0 0 340px", scrollSnapAlign: "start" }}>
                  {isMobile ? (
                    <GCardMobile v={v} saved={savedIds.includes(v.id)} onSave={toggleSave} onView={onViewVenue} />
                  ) : (
                    <GCard v={v} saved={savedIds.includes(v.id)} onSave={toggleSave} onView={onViewVenue} onQuickView={setQvItem} />
                  )}
                </div>
              ))}
            </SliderNav>
          </div>

          {/* ═══ 7. SIGNATURE COLLECTION (slider) — always-dark section ════ */}
          <div style={{ marginTop: 72 }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
            </div>
            <section style={{ position: "relative", height: 560, background: "#020201", overflow: "hidden" }}>
              <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #C9A84C, #e8c97a, transparent)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite", zIndex: 3 }} />
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${cur.imgs[0]})`, backgroundSize: "cover", backgroundPosition: "center", opacity: slideFade ? 1 : 0, transition: "opacity 0.4s ease", transform: "scale(1.03)" }} />
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(4,3,2,0.88) 0%, rgba(4,3,2,0.55) 50%, rgba(4,3,2,0.2) 100%)" }} />
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(4,3,2,0.65) 100%)" }} />

              <div className="usa-hero-content" style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", maxWidth: 650, opacity: slideFade ? 1 : 0, transform: slideFade ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.4s, transform 0.8s ease" }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 8 }}>✦ LWD Signature Collection</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 20, lineHeight: 1.5 }}>
                  Reserved for venues that define the LWD standard.<br />
                  <span style={{ fontSize: 9, letterSpacing: "1px" }}>Limited placements · By invitation</span>
                </div>
                <h2 style={{ fontFamily: GD, fontSize: "clamp(36px,4.5vw,58px)", fontWeight: 400, fontStyle: "italic", color: "#ffffff", lineHeight: 1.1, margin: "0 0 12px" }}>{cur.name}</h2>
                <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{cur.city}, {cur.region} · Up to {cur.capacity} guests</div>
                <p style={{ fontFamily: NU, fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: 480, marginBottom: 24 }}>{cur.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#C9A84C", fontSize: 12 }}>{"★".repeat(Math.round(cur.rating))}</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{cur.rating} · {cur.reviews} reviews</span>
                </div>
              </div>

              <div style={{ position: "absolute", bottom: 40, right: 80, display: "flex", gap: 12, zIndex: 3 }}>
                {[{ label: "Previous", dir: -1, char: "←" }, { label: "Next", dir: 1, char: "→" }].map(({ label, dir, char }) => (
                  <button key={label} onClick={() => goSlide((slideIdx + dir + FEATURED.length) % FEATURED.length)} aria-label={label} style={{
                    width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                  >{char}</button>
                ))}
              </div>
              <div style={{ position: "absolute", bottom: 24, left: 80, display: "flex", gap: 6, zIndex: 3, alignItems: "center" }}>
                {FEATURED.map((_, i) => (
                  <button key={i} onClick={() => goSlide(i)} aria-label={`Slide ${i + 1}`} style={{ width: i === slideIdx ? 28 : 8, height: 2, borderRadius: 1, border: "none", cursor: "pointer", background: i === slideIdx ? "#C9A84C" : "rgba(255,255,255,0.3)", transition: "all 0.4s ease" }} />
                ))}
                <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>{String(slideIdx + 1).padStart(2, "0")}/{String(FEATURED.length).padStart(2, "0")}</span>
              </div>
            </section>
          </div>

          {/* ═══ 8. LATEST VENDORS ═══════════════════════════════════════ */}
          <div className="usa-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 8px", marginTop: 40 }}>
            <p style={{ fontFamily: GD, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 300, fontStyle: "italic", color: C.grey, letterSpacing: "0.5px", margin: "0 0 6px" }}>Latest Vendors.</p>
            <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, opacity: 0.6, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
              Planners, photographers, florists, and culinary artists — the professionals behind America's finest celebrations.
            </p>
          </div>
          <div className="usa-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 48px 0" }}>
            <SliderNav className="usa-vendor-slider" cardWidth={isMobile ? 300 : 340} gap={isMobile ? 12 : 16}>
              {(isMobile ? USA_VENDORS.slice(0, 8) : USA_VENDORS.slice(0, 12)).map((v) => (
                <div key={v.id} className="usa-vendor-card" style={{ flex: isMobile ? "0 0 300px" : "0 0 340px", scrollSnapAlign: "start" }}>
                  {isMobile ? (
                    <GCardMobile v={v} saved={savedIds.includes(v.id)} onSave={toggleSave} onView={onViewVenue} />
                  ) : (
                    <GCard v={v} saved={savedIds.includes(v.id)} onSave={toggleSave} onView={onViewVenue} onQuickView={setQvItem} />
                  )}
                </div>
              ))}
            </SliderNav>
          </div>

          {/* ═══ 9. EDITORIAL BANNER — cinematic with image ═══════════════ */}
          <section style={{ position: "relative", height: 480, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", marginTop: 80, overflow: "hidden", background: "#0a0806" }}>
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 760, padding: "0 40px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 60, height: 1, background: "rgba(255,255,255,0.2)" }} />
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "5px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Exclusively Curated</span>
                <div style={{ width: 60, height: 1, background: "rgba(255,255,255,0.2)" }} />
              </div>
              <h2 style={{ fontFamily: GD, fontSize: "clamp(26px,3vw,40px)", fontWeight: 400, color: "#ffffff", lineHeight: 1.15, margin: "0 0 18px" }}>
                America — where grand estates meet <span style={{ fontStyle: "italic", color: "#C9A84C" }}>endless possibility.</span>
              </h2>
              <p style={{ fontFamily: NU, fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 32px" }}>
                Every venue and vendor in our American collection has been personally visited and
                approved by our editorial team. Only the exceptional makes the list.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <button style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c97a 100%)", border: "none", borderRadius: 3, color: "#0f0d0a", padding: "13px 36px", fontSize: 10, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>Start Planning</button>
                <button onMouseEnter={() => setHovConsult(true)} onMouseLeave={() => setHovConsult(false)} style={{ background: "none", border: `1px solid ${hovConsult ? "#C9A84C" : "rgba(255,255,255,0.25)"}`, borderRadius: 3, color: hovConsult ? "#C9A84C" : "rgba(255,255,255,0.7)", padding: "13px 36px", fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all 0.25s" }}>Talk to a Consultant</button>
              </div>
            </div>
          </section>

          {/* ═══ 10. SEO / FAQ ════════════════════════════════════════════ */}
          <section className="usa-section" style={{ background: C.dark, borderTop: `1px solid ${C.border}`, padding: "80px 48px" }}>
            <div className="usa-seo-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
              <div>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 12 }}>Planning Guide</div>
                <div style={{ width: 28, height: 1, background: C.gold, opacity: 0.5, marginBottom: 20 }} />
                <h2 style={{ fontFamily: GD, fontSize: "clamp(24px,2.5vw,32px)", fontWeight: 400, color: C.off, lineHeight: 1.2, marginBottom: 18 }}>
                  Your Guide to <span style={{ fontStyle: "italic", color: C.gold }}>American Weddings</span>
                </h2>
                <p style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85, marginBottom: 12 }}>
                  The United States offers a wedding landscape of extraordinary breadth — from the
                  Gilded Age mansions of Newport to the sun-soaked vineyards of Sonoma County.
                </p>
                <p style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85, marginBottom: 28, opacity: 0.8 }}>
                  Understanding each region's character, season, and logistics is essential to planning
                  a celebration that feels both effortless and extraordinary.
                </p>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey, marginBottom: 12, opacity: 0.7 }}>Explore by Destination</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["New York","Napa Valley","Palm Beach","Aspen","Santa Barbara","Charleston","Hawaii","The Hamptons"].map((r) => (
                    <button key={r} onClick={() => onViewRegion("usa", slugify(r))} style={{ fontFamily: NU, fontSize: 11, color: C.grey, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-input)", padding: "6px 14px", background: "none", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; }}
                    >{r}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 12 }}>FAQ</div>
                <div style={{ width: 28, height: 1, background: C.gold, opacity: 0.5, marginBottom: 20 }} />
                <h2 style={{ fontFamily: GD, fontSize: "clamp(24px,2.5vw,32px)", fontWeight: 400, color: C.off, lineHeight: 1.2, marginBottom: 24 }}>
                  Common <span style={{ fontStyle: "italic", color: C.gold }}>Questions</span>
                </h2>
                {FAQS.map((faq, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "16px 0", textAlign: "left" }}>
                      <span style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 500, paddingRight: 20 }}>{faq.q}</span>
                      <span style={{ fontFamily: NU, fontSize: 18, color: C.gold, lineHeight: 1, flexShrink: 0, transform: openFaq === i ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.3s" }}>+</span>
                    </button>
                    {openFaq === i && <div style={{ padding: "0 0 16px", fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.75 }}>{faq.a}</div>}
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}` }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 28 }}>
                  {[["48","Curated venues"],["32","States covered"],["12–18mo","Avg. booking lead"],["100%","Personally verified"]].map(([val, label]) => (
                    <div key={label} style={{ background: C.card, borderRadius: "var(--lwd-radius-card)", padding: "16px 18px" }}>
                      <div style={{ fontFamily: GD, fontSize: 22, color: C.gold, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 4, letterSpacing: "0.5px", opacity: 0.6 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══ 11. CURATED DESTINATIONS ═════════════════════════════════ */}
          <section style={{ background: C.dark, borderTop: `1px solid ${C.border}`, padding: "80px 60px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                  <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>Curated Destinations</span>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                </div>
                <h2 style={{ fontFamily: GD, fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 400, color: C.off, lineHeight: 1.2, margin: 0 }}>
                  Explore by <span style={{ fontStyle: "italic", color: C.gold }}>Region</span>
                </h2>
              </div>
              <div className="usa-curated-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
                {CURATED.map((col) => (
                  <div key={col.title}>
                    <h3 style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.off, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>{col.title}</h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {col.items.map((dest) => (
                        <li key={dest}>
                          <button onClick={() => onViewRegion("usa", slugify(dest))} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: NU, fontSize: 13, fontWeight: 400, color: C.grey, padding: "5px 0", display: "block", width: "100%", textAlign: "left", transition: "color 0.2s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)} onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}
                          >{dest}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ 12. ALL STATES ═══════════════════════════════════════════ */}
          <div aria-hidden="true" style={{ background: C.dark, padding: "0 60px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent 80%)` }} />
          </div>
          <section style={{ background: C.dark, padding: "80px 60px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                  <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>Directory</span>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                </div>
                <h2 style={{ fontFamily: GD, fontSize: "clamp(24px, 2.8vw, 32px)", fontWeight: 400, color: C.off, lineHeight: 1.2, margin: 0 }}>
                  All <span style={{ fontStyle: "italic", color: C.gold }}>States</span>
                </h2>
              </div>
              <div className="usa-states-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0 40px" }}>
                {stateCols.map((col, ci) => (
                  <ul key={ci} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {col.map((state) => (
                      <li key={state}>
                        <button onClick={() => onViewRegion("usa", slugify(state))} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: NU, fontSize: 12, fontWeight: 400, color: C.grey, padding: "4px 0", display: "block", width: "100%", textAlign: "left", transition: "color 0.2s", opacity: 0.7 }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; e.currentTarget.style.opacity = 1; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = C.grey; e.currentTarget.style.opacity = 0.7; }}
                        >{state}</button>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </section>
        </main>

        <SiteFooter {...footerNav} />

        {/* ── Quick View modal ────────────────────────────────────────── */}
        {qvItem && <QuickViewModal item={qvItem} onClose={() => setQvItem(null)} onViewFull={(v) => { setQvItem(null); onViewVenue(v); }} />}
      </div>
    </ThemeCtx.Provider>
  );
}
