// --- src/data/geo.js -------------------------------------------------------
// Unified geographic entity layer -- single source of truth for countries, regions, cities.
// Imports Italy entities from ./italy/. UK/Ireland entities defined inline.
// All lookup helpers fallback safely -- never crash on missing data.

import { ITALY_COUNTRY } from "./italy/country.js";
import { ITALY_REGIONS } from "./italy/regions.js";
import { ITALY_CITIES } from "./italy/cities.js";

// ---------------------------------------------------------------------------
// VENDOR CATEGORIES
// ---------------------------------------------------------------------------

export const VENDOR_CATEGORIES = [
  { slug: "wedding-venues",   label: "Wedding Venues",     icon: "\u{1F3DB}" },
  { slug: "wedding-planners", label: "Wedding Planners",   icon: "\u{1F4CB}" },
  { slug: "photographers",    label: "Photographers",      icon: "\u{1F4F8}" },
  { slug: "videographers",    label: "Videographers",      icon: "\u{1F3AC}" },
  { slug: "florists",         label: "Florists",           icon: "\u{1F490}" },
  { slug: "caterers",         label: "Caterers",           icon: "\u{1F37D}" },
  { slug: "wedding-cakes",    label: "Wedding Cakes",      icon: "\u{1F382}" },
  { slug: "hair-makeup",      label: "Hair & Makeup",      icon: "\u{1F484}" },
  { slug: "entertainment",    label: "Entertainment",      icon: "\u{1F3B5}" },
  { slug: "stationery",       label: "Stationery",         icon: "\u{2709}" },
  { slug: "bridal-wear",      label: "Bridal Wear",        icon: "\u{1F457}" },
  { slug: "jewellers",        label: "Jewellers",          icon: "\u{1F48D}" },
  { slug: "transport",        label: "Transport",          icon: "\u{1F697}" },
  { slug: "event-design",     label: "Event Design",       icon: "\u{2728}" },
];

// ---------------------------------------------------------------------------
// COUNTRIES
// ---------------------------------------------------------------------------

export const COUNTRIES = [
  {
    slug: "italy",
    name: "Italy",
    iso2: "IT",
    listingCount: ITALY_COUNTRY.listingCount,
    seo: {
      title: ITALY_COUNTRY.seoTitleTemplate,
      metaDescription: ITALY_COUNTRY.metaDescriptionTemplate,
      canonicalPath: "/italy",
    },
    ai: {
      summary: ITALY_COUNTRY.aiSummary,
      focusKeywords: ITALY_COUNTRY.focusKeywords,
    },
    regions: ITALY_REGIONS.filter(r => !r.isLegacy).map(r => r.slug),
  },
  {
    slug: "england",
    name: "England",
    iso2: "GB",
    listingCount: 6,
    seo: {
      title: "Luxury Wedding Venues & Vendors in the UK | LWD",
      metaDescription:
        "Discover curated luxury wedding venues and vendors across England, Scotland, Wales and Northern Ireland.",
      canonicalPath: "/england",
    },
    ai: {
      summary:
        "Largest domestic wedding market. Strong county-level intent. London, Cotswolds, and Lake District lead search volume.",
      focusKeywords: [
        "uk wedding venues",
        "luxury wedding uk",
        "wedding vendors uk",
      ],
    },
    regions: [
      "london", "surrey", "kent", "sussex", "hampshire", "berkshire",
      "buckinghamshire", "oxfordshire", "essex", "hertfordshire",
      "devon", "cornwall", "somerset", "dorset", "wiltshire",
      "gloucestershire", "suffolk", "norfolk", "cambridgeshire", "bristol",
      "warwickshire", "staffordshire", "cheshire", "manchester",
      "lancashire", "derbyshire", "leicestershire", "nottinghamshire",
      "shropshire", "liverpool",
      "yorkshire", "northumberland", "durham", "cumbria",
      "edinburgh", "highlands",
      "cardiff", "pembrokeshire",
      "belfast",
    ],
  },
  {
    slug: "france",
    name: "France",
    iso2: "FR",
    listingCount: 0,
    seo: {
      title: "Luxury Wedding Venues in France | LWD",
      metaDescription:
        "Discover France's finest luxury wedding venues and vendors.",
      canonicalPath: "/france",
    },
    ai: {
      summary:
        "Premier European destination. Provence, Côte d'Azur, and Châteaux Loire Valley lead market.",
      focusKeywords: [
        "france wedding venues",
        "luxury wedding france",
        "french chateau wedding",
      ],
    },
    regions: [],
  },
  {
    slug: "hungary",
    name: "Hungary",
    iso2: "HU",
    listingCount: 2,
    seo: {
      title: "Luxury Wedding Venues in Hungary | LWD",
      metaDescription:
        "Discover curated luxury wedding venues in Hungary. Budapest thermal palaces and Hungarian wine country estates, editorially selected.",
      canonicalPath: "/hungary",
    },
    ai: {
      summary:
        "Budapest's thermal bath palaces, Danube-spanning bridges and Art Nouveau grandeur make Hungary an increasingly sought-after European wedding destination with exceptional value.",
      focusKeywords: [
        "luxury wedding hungary",
        "budapest wedding venue",
        "hungarian castle wedding",
      ],
    },
    regions: [],
  },
  {
    slug: "ireland",
    name: "Ireland",
    iso2: "IE",
    listingCount: 0,
    seo: {
      title: "Luxury Wedding Venues in Ireland | LWD",
      metaDescription:
        "Discover Ireland's finest luxury wedding venues and vendors.",
      canonicalPath: "/ireland",
    },
    ai: {
      summary:
        "Growing luxury destination market. Castle and country estate weddings dominate. Dublin urban market emerging.",
      focusKeywords: [
        "ireland wedding venues",
        "luxury wedding ireland",
      ],
    },
    regions: ["dublin"],
  },
  {
    slug: "spain",
    name: "Spain",
    iso2: "ES",
    listingCount: 0,
    seo: {
      title: "Luxury Wedding Venues in Spain | LWD",
      metaDescription: "Discover Spain's finest luxury wedding venues and vendors.",
      canonicalPath: "/spain",
    },
    ai: {
      summary: "Sun-drenched fincas, Andalusian palaces, and Balearic clifftops. Barcelona and Marbella lead the luxury market.",
      focusKeywords: ["spain wedding venues", "luxury wedding spain", "ibiza wedding venue"],
    },
    regions: [],
  },
  {
    slug: "greece",
    name: "Greece",
    iso2: "GR",
    listingCount: 0,
    seo: {
      title: "Luxury Wedding Venues in Greece | LWD",
      metaDescription: "Discover Greece's finest luxury wedding venues and vendors.",
      canonicalPath: "/greece",
    },
    ai: {
      summary: "Santorini and Mykonos dominate the aspirational market. Whitewashed clifftop ceremonies and Aegean light define the aesthetic.",
      focusKeywords: ["greece wedding venues", "santorini wedding", "luxury wedding greece"],
    },
    regions: [],
  },
  {
    slug: "usa",
    name: "USA",
    iso2: "US",
    listingCount: 0,
    seo: {
      title: "Luxury Wedding Venues in the USA | LWD",
      metaDescription: "Discover the USA's finest luxury wedding venues and vendors.",
      canonicalPath: "/usa",
    },
    ai: {
      summary: "Vast and diverse market. Napa Valley, The Hamptons, and New York City lead luxury intent. Ranch weddings and coastal estates strong.",
      focusKeywords: ["usa wedding venues", "luxury wedding usa", "napa valley wedding"],
    },
    regions: [],
  },
];

// ---------------------------------------------------------------------------
// REGIONS
// ---------------------------------------------------------------------------

const ALL_REGIONS_SENTINEL = {
  slug: "all",
  name: "All Regions",
  countrySlug: null,
  group: null,
  priorityLevel: null,
  listingCount: 0,
  heroTitle: null,
  heroSubtitle: null,
  heroImg: null,
  introEditorial: null,
  categoryShortcuts: [],
  cities: [],
  seo: { title: "", metaDescription: "", canonicalPath: "" },
  ai: {
    summary: "",
    focusKeywords: [],
    intentSignals: { high: [], mid: [], low: [] },
    schemaType: null,
  },
  relatedRegionSlugs: [],
};

// --- Italy regions (non-legacy) mapped to unified schema ------------------

const ITALY_REGIONS_MAPPED = ITALY_REGIONS.filter(r => !r.isLegacy).map(r => ({
  slug: r.slug,
  name: r.name,
  countrySlug: "italy",
  group: "Italy",
  priorityLevel: r.priorityLevel,
  listingCount: r.listingCount,
  heroTitle: r.heroSubtitle ? null : `Weddings in ${r.name}`,
  heroSubtitle: r.heroSubtitle || null,
  heroImg: null,
  introEditorial: r.description,
  categoryShortcuts: VENDOR_CATEGORIES.map(vc => ({
    categorySlug: vc.slug,
    label: vc.label,
    count: 0,
  })),
  cities: ITALY_CITIES.filter(c => c.regionSlug === r.slug).map(c => c.slug),
  seo: {
    title: `Luxury Wedding Venues in ${r.name}, Italy | LWD`,
    metaDescription: r.description,
    canonicalPath: r.canonicalRoute,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
  },
  ai: {
    summary: r.aiSummary,
    focusKeywords: r.focusKeywords,
    intentSignals: r.intentSignals,
    schemaType: "Place",
  },
  relatedRegionSlugs: [],
}));

// --- Full-content UK / Ireland regions ------------------------------------

const UK_IRELAND_FULL_REGIONS = [
  // London
  {
    slug: "london",
    name: "London",
    countrySlug: "england",
    group: "England",
    priorityLevel: "primary",
    listingCount: 12,
    heroTitle: "Weddings in London",
    heroSubtitle: "From Mayfair townhouses to skyline terraces, the United Kingdom's most distinguished collection of luxury wedding venues.",
    heroImg:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
    introEditorial:
      "London commands a position no other British city can claim. Twelve distinct districts, each with its own character, deliver over two hundred licensed wedding venues ranging from Grade I–listed Georgian townhouses and private members' clubs to contemporary riverside terraces and converted power stations. The capital concentrates the United Kingdom's finest caterers, florists, photographers and planners within a single metropolitan area, precision, prestige and an unmatched density of excellence.",
    categoryShortcuts: VENDOR_CATEGORIES.map(vc => ({
      categorySlug: vc.slug,
      label: vc.label,
      count: 0,
    })),
    localTerm: "Districts",
    trustSignals: [
      "Central London",
      "West London",
      "City of London",
      "Civil & Religious Licences",
      "Historic Royal Borough Venues",
      "Private Members' Clubs",
    ],
    cities: ["mayfair", "chelsea", "kensington", "the-city", "hampstead", "shoreditch", "richmond", "notting-hill", "south-bank", "belgravia"],
    seo: {
      title: "Luxury Wedding Venues in London | LWD",
      metaDescription:
        "Discover London's finest curated luxury wedding venues, planners, photographers and vendors. From Mayfair townhouses to Thames-side terraces.",
      canonicalPath: "/england/london",
      ogTitle: "London Wedding Venues & Vendors | LWD",
      ogDescription: null,
      ogImage: null,
    },
    ai: {
      summary:
        "Highest search volume UK county for wedding venues. Year-round demand with spring/autumn peaks. Mayfair, Chelsea and South Bank dominate luxury tier.",
      focusKeywords: [
        "london wedding venues",
        "luxury wedding london",
        "wedding planner london",
        "mayfair wedding venue",
      ],
      intentSignals: {
        high: [
          "book wedding venue london",
          "london wedding planner hire",
        ],
        mid: [
          "best wedding venues london",
          "luxury wedding london ideas",
        ],
        low: [
          "london wedding inspiration",
          "getting married in london",
        ],
      },
      schemaType: "Place",
    },
    relatedRegionSlugs: ["surrey", "kent", "essex", "hertfordshire", "berkshire", "hampshire", "buckinghamshire", "oxfordshire"],

    // ── E-E-A-T Editorial Content (AI-generated on backend) ──────────────
    editorial: {
      headline: "The Capital of British Celebration",
      standfirst: "Three centuries of hosting the grandest celebrations in Europe. Eighteen months of editorial verification. Every venue on this page earned its place.",
      sections: [
        {
          heading: "A City of Unmatched Venue Diversity",
          body: "No other city on earth offers the breadth of wedding settings that London delivers. Within a single square mile you can choose between a Grade I–listed Georgian townhouse, a converted Victorian power station, a rooftop terrace overlooking the Thames, or a members-only garden square accessible to fewer than two hundred families. This density of choice is London's defining advantage, and it's why couples travel from over forty countries each year to marry here. From the gilded state rooms of Spencer House in Mayfair to the wisteria-draped pergola hidden above Hampstead Heath, every neighbourhood has its own character, its own light, and its own story to tell.",
        },
        {
          heading: "The LWD Verification Standard",
          body: "Every venue listed on this page has been personally visited, photographed and assessed by our editorial team. We evaluate over thirty criteria including natural light quality, acoustics, catering flexibility, accessibility, overnight accommodation, and, critically, how the venue performs on the day itself, not just in marketing materials. We reject approximately sixty percent of the venues we visit. Those that make our directory represent the genuine best of London.",
        },
        {
          heading: "Neighbourhood Guide for Couples",
          body: "Mayfair and Belgravia command the ultra-luxury tier, expect five-star hotels, private members' clubs, and starting prices above £25,000. Chelsea and South Bank deliver a blend of heritage and contemporary cool, ideal for couples who want tradition without formality. Hampstead and Richmond offer rare green space for garden ceremonies within zone two, while Shoreditch and King's Cross cater to the creative couple seeking industrial-chic warehouse settings with bespoke catering. Each neighbourhood shapes the tone of your celebration before a single flower is arranged.",
        },
        {
          heading: "Seasonal Considerations & Insider Advice",
          body: "London's peak wedding season runs April through September, with Saturday dates at premium venues booking twelve to eighteen months ahead. Autumn weddings, particularly October, offer a sweet spot: warm golden light, lower venue rates, and the capital's parks ablaze with colour. Winter weddings in December and January unlock dramatic settings at significantly reduced cost, and several venues on our list offer exclusive Christmas and New Year packages. Our editorial recommendation: consider a Thursday or Friday celebration for thirty to forty percent savings at identical venues.",
        },
      ],
      expertNote: {
        author: "LWD Editorial Team",
        credential: "18 months · 200+ venue visits · London",
        quote: "London is the only city where we've found venues that genuinely surprise us on every visit. The depth of quality here, from a hidden Jacobean hall in the City to a modernist gallery in Mayfair, is without equal.",
      },
      lastVerified: "February 2026",
    },
  },

  // Surrey
  {
    slug: "surrey",
    name: "Surrey",
    countrySlug: "england",
    group: "England",
    priorityLevel: "primary",
    listingCount: 0,
    heroTitle: "Weddings in Surrey",
    heroSubtitle: "Country estates and rolling hills on London's doorstep",
    heroImg:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80",
    introEditorial:
      "Surrey offers the perfect blend of countryside beauty and metropolitan convenience, making it one of England's most sought-after wedding destinations. Just thirty minutes from central London, the county unfolds into a landscape of ancient woodlands, manicured estates and quintessentially English villages. From the grandeur of Clandon Park and the romantic gardens of Loseley Park to boutique barn conversions in the Surrey Hills and elegant golf club settings overlooking the North Downs, the county caters to every vision. Surrey's proximity to London means access to the capital's finest vendors while celebrating in genuinely rural surroundings \u2014 a combination that makes it irresistible for discerning couples.",
    categoryShortcuts: VENDOR_CATEGORIES.map(vc => ({
      categorySlug: vc.slug,
      label: vc.label,
      count: 0,
    })),
    cities: ["guildford", "farnham", "dorking"],
    seo: {
      title: "Luxury Wedding Venues in Surrey | LWD",
      metaDescription:
        "Discover Surrey's finest luxury wedding venues and vendors. Country estates, boutique barns and elegant settings on London's doorstep.",
      canonicalPath: "/england/surrey",
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    },
    ai: {
      summary:
        "Premium commuter-belt county. Strong country estate and barn conversion market. London overflow demand significant.",
      focusKeywords: [
        "surrey wedding venues",
        "luxury wedding surrey",
        "country house wedding surrey",
      ],
      intentSignals: {
        high: ["surrey wedding venue hire", "surrey wedding planner"],
        mid: ["best wedding venues surrey"],
        low: ["surrey wedding ideas"],
      },
      schemaType: "Place",
    },
    relatedRegionSlugs: ["london", "kent", "hampshire", "berkshire", "sussex"],
  },

  // Edinburgh
  {
    slug: "edinburgh",
    name: "Edinburgh",
    countrySlug: "scotland",
    group: "Scotland",
    priorityLevel: "primary",
    listingCount: 0,
    heroTitle: "Weddings in Edinburgh",
    heroSubtitle: "Castle spires, Georgian grandeur and Scottish romance",
    heroImg:
      "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?auto=format&fit=crop&w=1600&q=80",
    introEditorial:
      "Edinburgh is one of the most romantic cities in the world for a wedding. The dramatic silhouette of Edinburgh Castle presiding over the Old Town, the sweeping Georgian crescents of the New Town, and the wild beauty of Arthur's Seat create a backdrop that no other British city can rival. Celebrate in a medieval castle, a Georgian assembly room, a Michelin-starred restaurant or a contemporary gallery space \u2014 Edinburgh offers extraordinary range within a compact, walkable city. Scottish wedding traditions add a layer of ceremony and emotion that guests never forget, from pipers greeting arrivals to ceilidh dancing that brings everyone together. The city's world-class hotels, renowned chefs and thriving creative scene ensure every detail meets the highest standard.",
    categoryShortcuts: VENDOR_CATEGORIES.map(vc => ({
      categorySlug: vc.slug,
      label: vc.label,
      count: 0,
    })),
    cities: ["old-town", "new-town", "leith"],
    seo: {
      title: "Luxury Wedding Venues in Edinburgh | LWD",
      metaDescription:
        "Discover Edinburgh's finest luxury wedding venues and vendors. From castle celebrations to Georgian grandeur in Scotland's capital.",
      canonicalPath: "/scotland/edinburgh",
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    },
    ai: {
      summary:
        "Scotland's premier wedding city. Castle and Georgian venue market. Strong international demand from US and Europe. Hogmanay and Festival seasons create unique opportunities.",
      focusKeywords: [
        "edinburgh wedding venues",
        "luxury wedding edinburgh",
        "castle wedding edinburgh",
        "scottish wedding",
      ],
      intentSignals: {
        high: [
          "edinburgh castle wedding venue",
          "edinburgh wedding planner hire",
        ],
        mid: ["best edinburgh wedding venues"],
        low: [
          "edinburgh wedding ideas",
          "scottish wedding traditions",
        ],
      },
      schemaType: "Place",
    },
    relatedRegionSlugs: ["highlands"],
  },

  // Cardiff
  {
    slug: "cardiff",
    name: "Cardiff",
    countrySlug: "wales",
    group: "Wales",
    priorityLevel: "primary",
    listingCount: 0,
    heroTitle: "Weddings in Cardiff",
    heroSubtitle: "Welsh heritage and cosmopolitan elegance",
    heroImg:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=80",
    introEditorial:
      "Cardiff combines the warmth of Welsh hospitality with a cosmopolitan energy that makes it a compelling wedding destination. The Welsh capital offers everything from fairy-tale castle celebrations at Cardiff Castle and Castell Coch to sleek waterfront venues in Cardiff Bay and intimate country house settings in the surrounding Vale of Glamorgan. The city's renowned food scene, vibrant arts culture and passionate musical heritage create a celebration atmosphere that is uniquely Welsh. With excellent transport links and a growing reputation for luxury hospitality, Cardiff is emerging as one of the UK's most exciting wedding destinations.",
    categoryShortcuts: VENDOR_CATEGORIES.map(vc => ({
      categorySlug: vc.slug,
      label: vc.label,
      count: 0,
    })),
    cities: ["cardiff-bay", "vale-of-glamorgan"],
    seo: {
      title: "Luxury Wedding Venues in Cardiff | LWD",
      metaDescription:
        "Discover Cardiff's finest luxury wedding venues and vendors. Castle celebrations, waterfront venues and Welsh hospitality.",
      canonicalPath: "/wales/cardiff",
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    },
    ai: {
      summary:
        "Wales premier wedding city. Castle and waterfront venues lead. Growing luxury market. Strong local and English border demand.",
      focusKeywords: [
        "cardiff wedding venues",
        "luxury wedding cardiff",
        "welsh wedding",
      ],
      intentSignals: {
        high: ["cardiff castle wedding venue"],
        mid: ["best cardiff wedding venues"],
        low: ["cardiff wedding ideas"],
      },
      schemaType: "Place",
    },
    relatedRegionSlugs: ["pembrokeshire"],
  },

  // Dublin
  {
    slug: "dublin",
    name: "Dublin",
    countrySlug: "ireland",
    group: "Ireland",
    priorityLevel: "primary",
    listingCount: 0,
    heroTitle: "Weddings in Dublin",
    heroSubtitle: "Georgian elegance and Irish warmth",
    heroImg:
      "https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&w=1600&q=80",
    introEditorial:
      "Dublin offers a wedding experience steeped in history, warmth and genuine Irish hospitality. From Georgian townhouse celebrations on Merrion Square to grand hotel ballrooms overlooking St Stephen's Green and converted industrial spaces in the Docklands, the Irish capital delivers sophistication with soul. Dublin's legendary food scene \u2014 from Michelin-starred restaurants to artisan producers \u2014 ensures every wedding feast is memorable. The city's natural gift for celebration, its world-famous music tradition and the unmatched warmth of Irish welcome create an atmosphere that international guests consistently describe as the best wedding they've ever attended.",
    categoryShortcuts: VENDOR_CATEGORIES.map(vc => ({
      categorySlug: vc.slug,
      label: vc.label,
      count: 0,
    })),
    cities: ["city-centre", "dalkey", "howth"],
    seo: {
      title: "Luxury Wedding Venues in Dublin | LWD",
      metaDescription:
        "Discover Dublin's finest luxury wedding venues and vendors. Georgian elegance, world-class dining and legendary Irish hospitality.",
      canonicalPath: "/ireland/dublin",
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    },
    ai: {
      summary:
        "Ireland's premier wedding city. Georgian and grand hotel venue market. Strong transatlantic demand from US-Irish diaspora.",
      focusKeywords: [
        "dublin wedding venues",
        "luxury wedding dublin",
        "irish wedding",
      ],
      intentSignals: {
        high: ["dublin wedding venue hire", "dublin wedding planner"],
        mid: ["best dublin wedding venues"],
        low: ["dublin wedding ideas"],
      },
      schemaType: "Place",
    },
    relatedRegionSlugs: [],
  },
];

// --- Skeleton UK / Ireland regions ----------------------------------------

function skeletonRegion(slug, name, countrySlug, group, relatedRegionSlugs = []) {
  const canonicalPrefix = countrySlug === "ireland" ? "/ireland" : `/${countrySlug}`;
  return {
    slug,
    name,
    countrySlug,
    group,
    priorityLevel: "secondary",
    listingCount: 0,
    heroTitle: `Weddings in ${name}`,
    heroSubtitle: null,
    heroImg: null,
    introEditorial: `Discover luxury wedding venues and vendors in ${name}.`,
    categoryShortcuts: VENDOR_CATEGORIES.map(vc => ({
      categorySlug: vc.slug,
      label: vc.label,
      count: 0,
    })),
    cities: [],
    seo: {
      title: `Luxury Wedding Venues in ${name} | LWD`,
      metaDescription: `Discover ${name}'s finest luxury wedding venues and vendors.`,
      canonicalPath: `${canonicalPrefix}/${slug}`,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    },
    ai: {
      summary: "",
      focusKeywords: [`${slug} wedding venues`],
      intentSignals: { high: [], mid: [], low: [] },
      schemaType: "Place",
    },
    relatedRegionSlugs,
  };
}

const UK_IRELAND_SKELETON_REGIONS = [
  // England
  skeletonRegion("kent", "Kent", "england", "England", ["london", "surrey", "sussex"]),
  skeletonRegion("sussex", "Sussex", "england", "England", ["surrey", "kent", "hampshire"]),
  skeletonRegion("hampshire", "Hampshire", "england", "England", ["surrey", "dorset", "wiltshire"]),
  skeletonRegion("berkshire", "Berkshire", "england", "England", ["surrey", "oxfordshire", "buckinghamshire"]),
  skeletonRegion("buckinghamshire", "Buckinghamshire", "england", "England", ["berkshire", "oxfordshire", "hertfordshire"]),
  skeletonRegion("oxfordshire", "Oxfordshire", "england", "England", ["berkshire", "buckinghamshire", "gloucestershire"]),
  skeletonRegion("essex", "Essex", "england", "England", ["london", "hertfordshire", "suffolk"]),
  skeletonRegion("hertfordshire", "Hertfordshire", "england", "England", ["london", "essex", "buckinghamshire"]),
  skeletonRegion("devon", "Devon", "england", "England", ["cornwall", "somerset", "dorset"]),
  skeletonRegion("cornwall", "Cornwall", "england", "England", ["devon"]),
  skeletonRegion("somerset", "Somerset", "england", "England", ["devon", "dorset", "wiltshire"]),
  skeletonRegion("dorset", "Dorset", "england", "England", ["hampshire", "somerset", "wiltshire"]),
  skeletonRegion("wiltshire", "Wiltshire", "england", "England", ["hampshire", "dorset", "gloucestershire"]),
  skeletonRegion("gloucestershire", "Gloucestershire", "england", "England", ["oxfordshire", "wiltshire", "bristol"]),
  skeletonRegion("suffolk", "Suffolk", "england", "England", ["essex", "norfolk", "cambridgeshire"]),
  skeletonRegion("norfolk", "Norfolk", "england", "England", ["suffolk", "cambridgeshire"]),
  skeletonRegion("cambridgeshire", "Cambridgeshire", "england", "England", ["suffolk", "norfolk", "hertfordshire"]),
  skeletonRegion("bristol", "Bristol", "england", "England", ["gloucestershire", "somerset"]),
  skeletonRegion("warwickshire", "Warwickshire", "england", "England", ["staffordshire", "leicestershire", "oxfordshire"]),
  skeletonRegion("staffordshire", "Staffordshire", "england", "England", ["cheshire", "derbyshire", "warwickshire"]),
  skeletonRegion("cheshire", "Cheshire", "england", "England", ["manchester", "staffordshire", "shropshire"]),
  skeletonRegion("manchester", "Manchester", "england", "England", ["cheshire", "lancashire", "derbyshire"]),
  skeletonRegion("lancashire", "Lancashire", "england", "England", ["manchester", "cumbria", "yorkshire"]),
  skeletonRegion("derbyshire", "Derbyshire", "england", "England", ["staffordshire", "nottinghamshire", "leicestershire"]),
  skeletonRegion("leicestershire", "Leicestershire", "england", "England", ["warwickshire", "derbyshire", "nottinghamshire"]),
  skeletonRegion("nottinghamshire", "Nottinghamshire", "england", "England", ["derbyshire", "leicestershire", "yorkshire"]),
  skeletonRegion("shropshire", "Shropshire", "england", "England", ["cheshire", "staffordshire"]),
  skeletonRegion("liverpool", "Liverpool", "england", "England", ["cheshire", "lancashire", "manchester"]),
  skeletonRegion("yorkshire", "Yorkshire", "england", "England", ["lancashire", "derbyshire", "durham"]),
  skeletonRegion("northumberland", "Northumberland", "england", "England", ["durham", "cumbria"]),
  skeletonRegion("durham", "Durham", "england", "England", ["northumberland", "yorkshire", "cumbria"]),
  skeletonRegion("cumbria", "Cumbria", "england", "England", ["lancashire", "northumberland", "durham"]),

  // Scotland
  skeletonRegion("highlands", "Highlands", "england", "Scotland", ["edinburgh"]),

  // Wales
  skeletonRegion("pembrokeshire", "Pembrokeshire", "england", "Wales", ["cardiff"]),

  // Northern Ireland
  skeletonRegion("belfast", "Belfast", "england", "Northern Ireland", []),
];

// --- France regions --------------------------------------------------------

const FRANCE_REGIONS = [
  {
    slug: "provence",
    name: "Provence",
    countrySlug: "france",
    group: "France",
    priorityLevel: 1,
    listingCount: 0,
    heroTitle: "Weddings in Provence",
    heroSubtitle: "Lavender fields, hilltop villages and sun-drenched châteaux in the south of France.",
    heroImg: null,
    introEditorial: "Provence is one of Europe's most romantic wedding destinations — a landscape of lavender, limestone and ancient light. From the hilltop perch of Gordes to the grand allées of the Luberon, the region offers an unmatched combination of natural beauty and refined venue stock. Weddings here are unhurried, sensory affairs: long tables beneath century-old planes, rosé poured at golden hour, the scent of wild herbs in evening air.",
    categoryShortcuts: [],
    cities: ["gordes", "luberon", "aix-en-provence", "avignon", "les-baux-de-provence", "saint-remy-de-provence"],
    localTerm: "Areas",
    seo: {
      title: "Luxury Wedding Venues in Provence, France | LWD",
      metaDescription: "Discover curated luxury wedding venues in Provence — from hilltop châteaux in the Luberon to elegant estates near Aix-en-Provence. Personally verified by the LWD editorial team.",
      canonicalPath: "/france/provence",
    },
    ai: {
      summary: "Provence — lavender fields, hilltop villages and sun-drenched châteaux in southern France.",
      focusKeywords: ["luxury wedding provence", "provence wedding venue", "chateau wedding provence", "luberon wedding", "aix-en-provence wedding"],
    },
    relatedRegionSlugs: ["paris", "dordogne", "normandy"],
  },
  {
    slug: "paris",
    name: "Paris",
    countrySlug: "france",
    group: "France",
    priorityLevel: 1,
    listingCount: 0,
    heroTitle: "Weddings in Paris",
    heroSubtitle: "Iconic city weddings in the world's most romantic capital.",
    heroImg: null,
    introEditorial: "Paris remains the gold standard for romantic city weddings — from grand Haussmann ballrooms and private hôtels particuliers to intimate Left Bank venues overlooking the Seine.",
    categoryShortcuts: [],
    cities: ["marais", "saint-germain", "montmartre", "champs-elysees"],
    localTerm: "Arrondissements",
    seo: {
      title: "Luxury Wedding Venues in Paris, France | LWD",
      metaDescription: "Discover curated luxury wedding venues in Paris — from grand ballrooms and private hôtels particuliers to intimate Left Bank venues.",
      canonicalPath: "/france/paris",
    },
    ai: {
      summary: "Paris — iconic city weddings in grand ballrooms and private hôtels particuliers.",
      focusKeywords: ["luxury wedding paris", "paris wedding venue", "chateau wedding paris", "wedding venue france"],
    },
    relatedRegionSlugs: ["provence", "normandy", "loire-valley"],
  },
  {
    slug: "loire-valley",
    name: "Loire Valley",
    countrySlug: "france",
    group: "France",
    priorityLevel: 2,
    listingCount: 0,
    heroTitle: "Weddings in the Loire Valley",
    heroSubtitle: "Fairy-tale châteaux along the royal river of France.",
    heroImg: null,
    introEditorial: "The Loire Valley, UNESCO-listed for its concentration of royal châteaux and Renaissance gardens, is France's premier castle-wedding destination.",
    categoryShortcuts: [],
    cities: ["tours", "amboise", "blois", "saumur"],
    localTerm: "Towns",
    seo: {
      title: "Luxury Wedding Venues in Loire Valley, France | LWD",
      metaDescription: "Discover curated luxury wedding venues in the Loire Valley — fairy-tale châteaux and royal gardens.",
      canonicalPath: "/france/loire-valley",
    },
    ai: {
      summary: "Loire Valley — fairy-tale châteaux and Renaissance gardens along the royal river.",
      focusKeywords: ["chateau wedding loire valley", "luxury wedding loire", "france chateau wedding"],
    },
    relatedRegionSlugs: ["paris", "normandy"],
  },
  {
    slug: "normandy",
    name: "Normandy",
    countrySlug: "france",
    group: "France",
    priorityLevel: 3,
    listingCount: 0,
    heroTitle: "Weddings in Normandy",
    heroSubtitle: "Clifftop manors and apple orchards in north-west France.",
    heroImg: null,
    introEditorial: "Normandy's dramatic coastline, half-timbered manor houses and rolling bocage countryside make it an increasingly sought-after wedding destination for couples looking beyond Paris.",
    categoryShortcuts: [],
    cities: ["honfleur", "deauville", "etretat", "bayeux"],
    localTerm: "Towns",
    seo: {
      title: "Luxury Wedding Venues in Normandy, France | LWD",
      metaDescription: "Discover curated luxury wedding venues in Normandy — clifftop manors, apple orchards and coastal estates.",
      canonicalPath: "/france/normandy",
    },
    ai: {
      summary: "Normandy — clifftop manors and dramatic coastline in north-west France.",
      focusKeywords: ["wedding normandy france", "chateau wedding normandy", "manor house wedding france"],
    },
    relatedRegionSlugs: ["paris", "loire-valley"],
  },
  {
    slug: "dordogne",
    name: "Dordogne",
    countrySlug: "france",
    group: "France",
    priorityLevel: 3,
    listingCount: 0,
    heroTitle: "Weddings in the Dordogne",
    heroSubtitle: "Medieval castles and golden stone villages in south-west France.",
    heroImg: null,
    introEditorial: "The Dordogne — La Périgord — is a pastoral idyll of golden limestone, walnut groves and medieval hilltop bastides. Its concentration of restored châteaux and farmhouse estates makes it a favourite for multi-day destination weddings.",
    categoryShortcuts: [],
    cities: ["sarlat", "bergerac", "perigueux"],
    localTerm: "Towns",
    seo: {
      title: "Luxury Wedding Venues in Dordogne, France | LWD",
      metaDescription: "Discover curated luxury wedding venues in the Dordogne — medieval castles and golden stone estates in south-west France.",
      canonicalPath: "/france/dordogne",
    },
    ai: {
      summary: "Dordogne — medieval castles and golden stone villages in south-west France.",
      focusKeywords: ["wedding dordogne france", "chateau wedding dordogne", "perigord wedding"],
    },
    relatedRegionSlugs: ["provence", "loire-valley"],
  },
];

// --- France cities ---------------------------------------------------------

const FRANCE_CITIES = [
  // Provence
  { slug: "gordes", name: "Gordes", regionSlug: "provence", countrySlug: "france", listingCount: 0, introEditorial: "Gordes is Provence's most iconic hilltop village — a cluster of ochre stone perched above the Luberon, surrounded by lavender fields and dry-stone terraces." },
  { slug: "luberon", name: "Luberon", regionSlug: "provence", countrySlug: "france", listingCount: 0, introEditorial: "The Luberon plateau offers some of Provence's most atmospheric estate venues, from restored bergeries to grand bastides overlooking vineyards and lavender." },
  { slug: "aix-en-provence", name: "Aix-en-Provence", regionSlug: "provence", countrySlug: "france", listingCount: 0, introEditorial: "Aix-en-Provence combines elegant 17th-century hôtels particuliers with café-lined cours for sophisticated city celebrations." },
  { slug: "avignon", name: "Avignon", regionSlug: "provence", countrySlug: "france", listingCount: 0, introEditorial: "Avignon's papal history lends grandeur to its wedding scene — with venues ranging from restored abbeys to private villas overlooking the Rhône." },
  { slug: "les-baux-de-provence", name: "Les Baux-de-Provence", regionSlug: "provence", countrySlug: "france", listingCount: 0, introEditorial: "Les Baux-de-Provence is a dramatic citadel village with breathtaking views across the Alpilles — surrounded by estate venues of exceptional quality." },
  { slug: "saint-remy-de-provence", name: "Saint-Rémy-de-Provence", regionSlug: "provence", countrySlug: "france", listingCount: 0, introEditorial: "Saint-Rémy is a chic market town at the foot of the Alpilles, ringed by mas and bastide estates ideal for intimate luxury celebrations." },
  // Paris
  { slug: "marais", name: "Le Marais", regionSlug: "paris", countrySlug: "france", listingCount: 0, introEditorial: "Le Marais blends medieval hôtels particuliers with contemporary gallery spaces for stylish Paris celebrations." },
  { slug: "saint-germain", name: "Saint-Germain-des-Prés", regionSlug: "paris", countrySlug: "france", listingCount: 0, introEditorial: "Saint-Germain delivers Left Bank sophistication in intimate salons and restored 18th-century mansion houses." },
  { slug: "montmartre", name: "Montmartre", regionSlug: "paris", countrySlug: "france", listingCount: 0, introEditorial: "Montmartre offers bohemian charm and sweeping city views from its hilltop perch above Paris." },
  { slug: "champs-elysees", name: "Champs-Élysées", regionSlug: "paris", countrySlug: "france", listingCount: 0, introEditorial: "The Champs-Élysées quarter hosts some of Paris's grandest ballrooms and five-star hotel venues." },
  // Loire Valley
  { slug: "tours", name: "Tours", regionSlug: "loire-valley", countrySlug: "france", listingCount: 0, introEditorial: "Tours is the gateway to the Loire Valley's châteaux, with elegant townhouse venues and easy access to surrounding estates." },
  { slug: "amboise", name: "Amboise", regionSlug: "loire-valley", countrySlug: "france", listingCount: 0, introEditorial: "Amboise sits beneath its royal château overlooking the Loire — a romantic setting for celebrations steeped in Renaissance history." },
  { slug: "blois", name: "Blois", regionSlug: "loire-valley", countrySlug: "france", listingCount: 0, introEditorial: "Blois offers access to some of the Loire's finest château estates, including Chambord and Cheverny nearby." },
  { slug: "saumur", name: "Saumur", regionSlug: "loire-valley", countrySlug: "france", listingCount: 0, introEditorial: "Saumur's troglodyte caves, clifftop château and sparkling wine heritage create a uniquely memorable wedding backdrop." },
  // Normandy
  { slug: "honfleur", name: "Honfleur", regionSlug: "normandy", countrySlug: "france", listingCount: 0, introEditorial: "Honfleur is Normandy's most painterly harbour town — a favourite for intimate celebrations in converted manors and half-timbered houses." },
  { slug: "deauville", name: "Deauville", regionSlug: "normandy", countrySlug: "france", listingCount: 0, introEditorial: "Deauville brings Côte Fleurie glamour — grand Belle Époque hotels and private estate venues overlooking the English Channel." },
  { slug: "etretat", name: "Étretat", regionSlug: "normandy", countrySlug: "france", listingCount: 0, introEditorial: "Étretat's iconic clifftop chalk arches provide a dramatic natural backdrop for coastal estate weddings." },
  { slug: "bayeux", name: "Bayeux", regionSlug: "normandy", countrySlug: "france", listingCount: 0, introEditorial: "Bayeux's medieval cathedral quarter and surrounding bocage countryside offer intimate, history-laden venues." },
  // Dordogne
  { slug: "sarlat", name: "Sarlat-la-Canéda", regionSlug: "dordogne", countrySlug: "france", listingCount: 0, introEditorial: "Sarlat's perfectly preserved medieval centre and surrounding valley châteaux make it the Dordogne's premier wedding destination." },
  { slug: "bergerac", name: "Bergerac", regionSlug: "dordogne", countrySlug: "france", listingCount: 0, introEditorial: "Bergerac's wine country estates and rolling vineyard landscapes make it ideal for relaxed multi-day celebrations." },
  { slug: "perigueux", name: "Périgueux", regionSlug: "dordogne", countrySlug: "france", listingCount: 0, introEditorial: "Périgueux offers grand Périgord manor houses and restored abbey venues in the heart of the Dordogne." },
];

// --- Assemble final REGIONS array -----------------------------------------

export const REGIONS = [
  ALL_REGIONS_SENTINEL,
  ...ITALY_REGIONS_MAPPED,
  ...UK_IRELAND_FULL_REGIONS,
  ...UK_IRELAND_SKELETON_REGIONS,
  ...FRANCE_REGIONS,
];

// ---------------------------------------------------------------------------
// CITIES
// ---------------------------------------------------------------------------

// --- Italy cities normalized to unified schema ----------------------------

const ITALY_CITIES_MAPPED = ITALY_CITIES.map(c => ({
  slug: c.slug,
  name: c.name,
  regionSlug: c.regionSlug,
  countrySlug: "italy",
  listingCount: c.listingCount,
  introEditorial: c.description,
}));

// --- UK / Ireland cities (full-content counties only) ---------------------

const UK_IRELAND_CITIES = [
  // London
  {
    slug: "mayfair",
    name: "Mayfair",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Mayfair is the pinnacle of London luxury, home to grand Georgian townhouses and five-star hotel ballrooms.",
  },
  {
    slug: "chelsea",
    name: "Chelsea",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Chelsea offers elegant garden squares and chic venues in one of London's most fashionable neighbourhoods.",
  },
  {
    slug: "kensington",
    name: "Kensington",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Kensington delivers palace-adjacent grandeur and museum-quarter sophistication in the heart of west London.",
  },
  {
    slug: "the-city",
    name: "The City",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "The City of London offers centuries-old livery halls, hidden Jacobean chambers and rooftop terraces above the Square Mile.",
  },
  {
    slug: "hampstead",
    name: "Hampstead",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Hampstead combines village charm with sweeping Heath views for romantic north London celebrations.",
  },
  {
    slug: "shoreditch",
    name: "Shoreditch",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Shoreditch delivers creative warehouse spaces and contemporary style in east London's cultural heart.",
  },
  {
    slug: "richmond",
    name: "Richmond",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Richmond offers riverside venues and royal parkland settings on the elegant southwestern edge of London.",
  },
  {
    slug: "notting-hill",
    name: "Notting Hill",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Notting Hill pairs pastel-coloured townhouses and private garden squares with an effortlessly chic west London atmosphere.",
  },
  {
    slug: "south-bank",
    name: "South Bank",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "The South Bank delivers dramatic Thames-side terraces and contemporary gallery spaces with iconic skyline views.",
  },
  {
    slug: "belgravia",
    name: "Belgravia",
    regionSlug: "london",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Belgravia is London's most refined neighbourhood, stucco-fronted crescents, embassy-grade townhouses, and discreet elegance at every turn.",
  },

  // Surrey
  {
    slug: "guildford",
    name: "Guildford",
    regionSlug: "surrey",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Guildford is Surrey's historic county town, offering castle grounds and riverside venues amid rolling countryside.",
  },
  {
    slug: "farnham",
    name: "Farnham",
    regionSlug: "surrey",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Farnham is a charming Georgian market town with elegant country house venues in the Surrey Hills.",
  },
  {
    slug: "dorking",
    name: "Dorking",
    regionSlug: "surrey",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "Dorking sits at the heart of the Surrey Hills, surrounded by vineyard estates and Box Hill views.",
  },

  // Edinburgh
  {
    slug: "old-town",
    name: "Old Town",
    regionSlug: "edinburgh",
    countrySlug: "scotland",
    listingCount: 0,
    introEditorial: "Edinburgh's Old Town offers medieval castle venues and historic closes beneath the Castle Rock.",
  },
  {
    slug: "new-town",
    name: "New Town",
    regionSlug: "edinburgh",
    countrySlug: "england",
    listingCount: 0,
    introEditorial: "The Georgian New Town provides elegant assembly rooms and sweeping crescent settings for refined celebrations.",
  },
  {
    slug: "leith",
    name: "Leith",
    regionSlug: "edinburgh",
    countrySlug: "scotland",
    listingCount: 0,
    introEditorial: "Leith is Edinburgh's vibrant waterfront district, home to converted warehouses and Michelin-starred dining.",
  },

  // Cardiff
  {
    slug: "cardiff-bay",
    name: "Cardiff Bay",
    regionSlug: "cardiff",
    countrySlug: "wales",
    listingCount: 0,
    introEditorial: "Cardiff Bay offers sleek waterfront venues with views across the barrage and the Senedd.",
  },
  {
    slug: "vale-of-glamorgan",
    name: "Vale of Glamorgan",
    regionSlug: "cardiff",
    countrySlug: "wales",
    listingCount: 0,
    introEditorial: "The Vale of Glamorgan provides country house estates and Heritage Coast settings just minutes from Cardiff.",
  },

  // Dublin
  {
    slug: "city-centre",
    name: "City Centre",
    regionSlug: "dublin",
    countrySlug: "ireland",
    listingCount: 0,
    introEditorial: "Dublin's City Centre delivers Georgian townhouse venues and grand hotel ballrooms around St Stephen's Green.",
  },
  {
    slug: "dalkey",
    name: "Dalkey",
    regionSlug: "dublin",
    countrySlug: "ireland",
    listingCount: 0,
    introEditorial: "Dalkey is a picturesque coastal village south of Dublin with castle venues and harbour views.",
  },
  {
    slug: "howth",
    name: "Howth",
    regionSlug: "dublin",
    countrySlug: "ireland",
    listingCount: 0,
    introEditorial: "Howth is a charming fishing village on Dublin's north side offering clifftop and harbour celebrations.",
  },
];

export const CITIES = [
  ...ITALY_CITIES_MAPPED,
  ...UK_IRELAND_CITIES,
  ...FRANCE_CITIES,
];

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

export function getCountryBySlug(slug) {
  return COUNTRIES.find(c => c.slug === slug) || null;
}

export function getRegionBySlug(slug) {
  if (!slug || slug === "all") return REGIONS[0];
  return REGIONS.find(r => r.slug === slug) || REGIONS[0];
}

export function getCityBySlug(slug) {
  return CITIES.find(c => c.slug === slug) || null;
}

export function getRegionsByCountry(countrySlug) {
  return REGIONS.filter(r => r.countrySlug === countrySlug);
}

// Backward-compat helpers
export function getRegionNameBySlug(slug) {
  return getRegionBySlug(slug).name;
}

export function getRegionSlugByName(name) {
  const found = REGIONS.find(r => r.name === name);
  return found ? found.slug : "all";
}

// Strict country derivation map -- no inference
const GROUP_TO_COUNTRY = {
  "Italy": "italy",
  "England": "england",
  "Scotland": "scotland",
  "Wales": "wales",
  "Northern Ireland": "northern-ireland",
  "Channel Islands": "england",
  "Ireland": "ireland",
};

export function countrySlugFromGroup(group) {
  return GROUP_TO_COUNTRY[group] || null;
}

// ---------------------------------------------------------------------------
// REGIONS_FLAT -- backward compatibility
// ---------------------------------------------------------------------------
// Exports region NAMES (labels), not slugs, for backward compat with
// existing filter comparisons in CategoryPage.
// Shape: { name, slug, group }

export const REGIONS_FLAT = REGIONS.map(r => ({
  name: r.name,
  slug: r.slug,
  group: r.group,
}));

// ---------------------------------------------------------------------------
// CANONICAL PATH BUILDERS, for future URL routing, used in SEO panels now
// ---------------------------------------------------------------------------

export function getRegionPath(countrySlug, regionSlug) {
  return `/${countrySlug}/${regionSlug}`;
}

export function getRegionCategoryPath(countrySlug, regionSlug, categorySlug) {
  return `/${countrySlug}/${regionSlug}/${categorySlug}`;
}

// ---------------------------------------------------------------------------
// VENDOR CATEGORY MAPPING, geo slug → vendors.js category values
// ---------------------------------------------------------------------------

const GEO_TO_VENDOR_CAT = {
  "wedding-planners": ["planner"],
  "photographers":    ["photographer"],
  "florists":         ["florist"],
  "caterers":         ["caterer"],
  "entertainment":    ["musician", "celebrant"],
};

export function geoSlugToVendorCategory(geoSlug) {
  return GEO_TO_VENDOR_CAT[geoSlug] || null;
}

export function getVendorCategoryByGeoSlug(geoSlug) {
  return VENDOR_CATEGORIES.find(vc => vc.slug === geoSlug) || null;
}

// ---------------------------------------------------------------------------
// REGION × CATEGORY EDITORIALS
// ---------------------------------------------------------------------------
// Full editorials for London × all 7 categories (showcase county).
// All other combos use template via getRegionCategoryEditorial().

const REGION_CATEGORY_EDITORIALS = {
  "london--wedding-venues":
    "London offers an extraordinary range of luxury wedding venues unlike anywhere else in the United Kingdom. From the timeless grandeur of Mayfair townhouses and Belgravia ballrooms to sweeping Thames-side terraces with skyline views and contemporary gallery spaces in Shoreditch, the capital delivers every style of celebration imaginable. Whether you envision a black-tie affair beneath crystal chandeliers, a bohemian garden party in Hampstead or a dramatic rooftop ceremony overlooking St Paul's Cathedral, London's diversity is its greatest strength. The city's concentration of five-star hotels, private members' clubs, historic livery halls and converted industrial spaces means couples are never short of options at any scale or budget. Our editorial team personally visits every venue before it appears on LWD, ensuring the collection represents only the very finest London has to offer.",

  "london--wedding-planners":
    "London is home to the United Kingdom's highest concentration of luxury wedding planners, from full-service design studios orchestrating multi-day celebrations to specialist day-of coordinators who ensure flawless execution. The capital's planners draw on unrivalled vendor networks spanning florists, caterers, couturiers, lighting designers and entertainment agencies, many of whom work exclusively by referral. Whether you need a bilingual planner for an international guest list, a specialist in Jewish or South Asian ceremonies, or a creative director who can transform a blank-canvas warehouse into a botanical wonderland, London delivers at the highest level. Many of the UK's most awarded planners are based here, bringing editorial-quality design thinking to every celebration. Our editorial team personally vets each planner's portfolio, client references and operational standards before recommending them on LWD.",

  "london--photographers":
    "London's wedding photography scene is among the most sophisticated in the world, shaped by the city's thriving fashion, editorial and documentary photography cultures. The capital's photographers range from fine-art portraitists who create gallery-worthy images to photojournalists who capture raw, unposed emotion with cinematic precision. London itself provides an extraordinary canvas, from the grandeur of Kensington Palace Gardens and the moody elegance of Marylebone to the industrial textures of Bermondsey and the sweeping river views from Battersea Power Station. Many London photographers are published in Vogue, Harpers Bazaar and Tatler, bringing fashion-world sensibility to every wedding they shoot. Whether your style is classic and timeless or bold and contemporary, LWD's curated selection represents only photographers whose work consistently meets the highest editorial standards.",

  "london--florists":
    "London's wedding florists draw on a heritage that stretches from the historic flower markets of Columbia Road and New Covent Garden to the cutting-edge installations of the Chelsea Flower Show. The city's floral designers range from romantic English garden specialists working with seasonal British blooms to avant-garde artists creating suspended installations, living walls and architectural centrepieces that transform entire venues. London florists have access to the widest range of flowers in the UK, sourced from Dutch auctions, British growers and specialist importers, enabling designs that simply aren't possible elsewhere. Whether you envision cascading peonies in soft blush tones, dramatic tropical arrangements, or minimalist single-stem tablescapes, London's florists deliver artistry at every scale. Every florist on LWD is selected for design excellence, reliability and the ability to execute flawlessly under pressure.",

  "london--caterers":
    "London's private dining and wedding catering scene is among the finest in the world, fuelled by the city's extraordinary concentration of Michelin-starred chefs, artisan producers and multi-cultural culinary traditions. From elegant silver-service banquets in historic halls to relaxed sharing feasts and street-food style receptions, London caterers bring world-class creativity to every menu. The city's caterers can accommodate virtually any dietary requirement, cultural tradition or cuisine, whether you want a classic British wedding breakfast, a South Asian feast for five hundred, or a seven-course tasting menu designed by a former Michelin-starred chef. Many of London's top caterers work exclusively with luxury weddings and private events, bringing hotel-level service to any venue. LWD's curated caterers are selected for culinary excellence, service standards and the ability to deliver consistently at scale.",

  "london--hair-makeup":
    "London's bridal beauty industry sits at the intersection of fashion, film and luxury, producing hair and makeup artists whose work graces the pages of Vogue, the runways of London Fashion Week and the sets of major film productions. The capital's bridal specialists offer everything from classic English beauty and vintage Hollywood glamour to contemporary editorial looks and South Asian bridal artistry with intricate techniques honed across generations. London's proximity to the UK's leading beauty brands, product houses and training academies means artists here have access to the latest techniques and products before anywhere else. Most offer trial sessions months in advance, working closely with brides to perfect a look that photographs beautifully in any light. Every artist on LWD is selected for technical skill, professionalism and consistently outstanding client reviews.",

  "london--entertainment":
    "London's wedding entertainment scene is unmatched in the United Kingdom, drawing from the city's world-class music, theatre and performance cultures. From string quartets trained at the Royal Academy of Music and jazz ensembles from Soho's legendary clubs to high-energy party bands, internationally touring DJs and bespoke theatrical experiences, London offers entertainment for every taste and every moment of the day. The city's entertainment agencies curate acts ranging from elegant cocktail-hour performers to spectacular late-night sets that keep dance floors packed until the early hours. Many London-based musicians and performers work regularly at the capital's most prestigious venues and private events, bringing polished professionalism and genuine star quality. LWD's curated entertainment providers are selected for performance excellence, reliability and the ability to read a room and elevate any celebration.",
};

export function getRegionCategoryEditorial(regionSlug, categorySlug) {
  const key = `${regionSlug}--${categorySlug}`;
  if (REGION_CATEGORY_EDITORIALS[key]) return REGION_CATEGORY_EDITORIALS[key];

  // Template fallback, never implies listings exist when count is 0
  const region = REGIONS.find(r => r.slug === regionSlug);
  const vc = VENDOR_CATEGORIES.find(c => c.slug === categorySlug);
  const regionName = region ? region.name : regionSlug || null;
  const label = vc ? vc.label : categorySlug;
  const inRegion = regionName ? ` in ${regionName}` : "";
  return `Discover the finest ${label}${inRegion}. Our editorial team is personally vetting every recommendation, we never accept pay-to-play listings. Premium ${label.toLowerCase()}${inRegion} are arriving soon.`;
}
