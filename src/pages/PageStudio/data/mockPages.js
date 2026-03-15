/**
 * Mock page data for Phase 1 development
 * Homepage is always pinned first (id: "page_home").
 */

export const MOCK_PAGES = [
  // ── PINNED: Homepage ──────────────────────────────────────────────────────
  {
    id: "page_home",
    title: "Homepage",
    slug: "/",
    pageType: "homepage",
    templateKey: "homepage",
    status: "published",
    excerpt: "The main landing page of Luxury Wedding Directory.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: {
      title: "Luxury Wedding Directory | Find Your Perfect Wedding Venue",
      metaDescription: "Discover the world's finest wedding venues, photographers, and planners with the Luxury Wedding Directory.",
      canonicalUrl: "https://luxuryweddingdirectory.com/",
      ogTitle: "Luxury Wedding Directory",
      ogDescription: "Find Your Perfect Wedding Venue",
      ogImage: "",
      noindex: false,
      structuredDataType: "WebSite"
    },
    sections: [],
    author: "Admin",
    updatedAt: new Date().toISOString(),
    publishedAt: "2026-01-01T00:00:00Z",
    scheduledAt: null
  },

  // ── Core site pages ───────────────────────────────────────────────────────
  {
    id: "page_about",
    title: "About Us",
    slug: "about-us",
    pageType: "custom",
    templateKey: "hero_image",
    status: "published",
    excerpt: "The story behind Luxury Wedding Directory, who we are and what we stand for.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: {
      title: "About Us | Luxury Wedding Directory",
      metaDescription: "Learn about the team behind Luxury Wedding Directory.",
      canonicalUrl: "",
      ogTitle: "", ogDescription: "", ogImage: "",
      noindex: false, structuredDataType: "WebPage"
    },
    sections: [],
    author: "Admin",
    updatedAt: "2026-03-01T10:00:00Z",
    publishedAt: "2026-01-20T10:00:00Z",
    scheduledAt: null
  },
  {
    id: "page_contact",
    title: "Contact Us",
    slug: "contact-us",
    pageType: "custom",
    templateKey: "hero_image",
    status: "published",
    excerpt: "Get in touch with our team for partnerships, listings, and general enquiries.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: {
      title: "Contact Us | Luxury Wedding Directory",
      metaDescription: "Get in touch with Luxury Wedding Directory.",
      canonicalUrl: "",
      ogTitle: "", ogDescription: "", ogImage: "",
      noindex: false, structuredDataType: "WebPage"
    },
    sections: [],
    author: "Admin",
    updatedAt: "2026-02-10T09:00:00Z",
    publishedAt: "2026-01-20T10:00:00Z",
    scheduledAt: null
  },
  {
    id: "page_how",
    title: "How It Works",
    slug: "how-it-works",
    pageType: "custom",
    templateKey: "hero_image",
    status: "draft",
    excerpt: "How couples find and book their dream wedding venues through LWD.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: {
      title: "How It Works | Luxury Wedding Directory",
      metaDescription: "Learn how Luxury Wedding Directory works for couples and venues.",
      canonicalUrl: "",
      ogTitle: "", ogDescription: "", ogImage: "",
      noindex: false, structuredDataType: "WebPage"
    },
    sections: [],
    author: "Admin",
    updatedAt: "2026-03-08T14:00:00Z",
    publishedAt: null,
    scheduledAt: null
  },

  // ── Legal pages ───────────────────────────────────────────────────────────
  {
    id: "page_privacy",
    title: "Privacy Policy",
    slug: "privacy-policy",
    pageType: "legal",
    templateKey: "editorial_long_form",
    status: "published",
    excerpt: "How we collect, use, and protect your personal data.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: {
      title: "Privacy Policy | Luxury Wedding Directory",
      metaDescription: "Our privacy policy explains how we handle your data.",
      canonicalUrl: "",
      ogTitle: "", ogDescription: "", ogImage: "",
      noindex: true, structuredDataType: "WebPage"
    },
    sections: [],
    author: "Admin",
    updatedAt: "2026-01-15T10:00:00Z",
    publishedAt: "2026-01-15T10:00:00Z",
    scheduledAt: null
  },
  {
    id: "page_terms",
    title: "Terms & Conditions",
    slug: "terms-and-conditions",
    pageType: "legal",
    templateKey: "editorial_long_form",
    status: "published",
    excerpt: "The terms and conditions governing use of the Luxury Wedding Directory platform.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: {
      title: "Terms & Conditions | Luxury Wedding Directory",
      metaDescription: "Terms and conditions for using Luxury Wedding Directory.",
      canonicalUrl: "",
      ogTitle: "", ogDescription: "", ogImage: "",
      noindex: true, structuredDataType: "WebPage"
    },
    sections: [],
    author: "Admin",
    updatedAt: "2026-01-15T10:00:00Z",
    publishedAt: "2026-01-15T10:00:00Z",
    scheduledAt: null
  },

  // ── Destination pages ─────────────────────────────────────────────────────
  {
    id: "page_001",
    title: "Luxury Wedding Venues in Lake Como",
    slug: "luxury-wedding-venues-in-lake-como",
    pageType: "destination",
    templateKey: "editorial_long_form",
    status: "published",
    excerpt: "A curated guide to the finest wedding venues in Lake Como, Italy.",
    featuredImage: "https://images.unsplash.com/photo-1519741497674-611481863552",
    heroVideoUrl: null,
    seo: {
      title: "Luxury Wedding Venues in Lake Como | LWD",
      metaDescription: "Discover the finest wedding venues in Lake Como with the Luxury Wedding Directory.",
      canonicalUrl: "https://example.com/luxury-wedding-venues-in-lake-como",
      ogTitle: "Lake Como Wedding Venues",
      ogDescription: "Curated luxury venues for your Lake Como wedding",
      ogImage: "https://images.unsplash.com/photo-1519741497674-611481863552",
      noindex: false, structuredDataType: "WebPage"
    },
    sections: [
      {
        id: "section_001", sectionType: "hero_image", sectionName: "Hero Image",
        position: 0, isVisible: true,
        content: { heading: "Lake Como Wedding Venues", subheading: "Where Romance Meets Italian Heritage", body: "", image: "https://images.unsplash.com/photo-1519741497674-611481863552", ctaText: "Explore Venues", ctaUrl: "#venues" },
        settings: { paddingTop: 60, paddingBottom: 40, backgroundColor: "", textAlign: "center", mobileVisible: true, desktopVisible: true }
      },
      {
        id: "section_002", sectionType: "rich_text", sectionName: "Introduction",
        position: 1, isVisible: true,
        content: { heading: "Why Lake Como?", body: "Lake Como represents the pinnacle of Italian wedding destinations. With its dramatic Alpine backdrop and charming villages, every venue offers breathtaking views.", image: null, ctaText: null, ctaUrl: null },
        settings: { paddingTop: 40, paddingBottom: 40, backgroundColor: "", textAlign: "left", mobileVisible: true, desktopVisible: true }
      }
    ],
    author: "Admin",
    updatedAt: "2026-03-05T14:30:00Z",
    publishedAt: "2026-02-15T10:00:00Z",
    scheduledAt: null
  },
  {
    id: "page_006",
    title: "Tuscan Countryside Weddings",
    slug: "tuscan-countryside-weddings",
    pageType: "destination",
    templateKey: "editorial_long_form",
    status: "draft",
    excerpt: "Plan your Tuscan wedding in the heart of Italy.",
    featuredImage: "https://images.unsplash.com/photo-1519741497674-611481863552",
    heroVideoUrl: null,
    seo: { title: "", metaDescription: "", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "", noindex: false, structuredDataType: "WebPage" },
    sections: [],
    author: "Admin",
    updatedAt: "2026-03-04T13:20:00Z",
    publishedAt: null,
    scheduledAt: null
  },
  {
    id: "page_italy",
    title: "Italy Wedding Venues Guide",
    slug: "italy-wedding-venues",
    pageType: "destination",
    templateKey: "editorial_long_form",
    status: "published",
    excerpt: "Everything you need to know about getting married in Italy.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: { title: "Italy Wedding Venues | LWD", metaDescription: "The complete guide to luxury wedding venues across Italy.", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "", noindex: false, structuredDataType: "WebPage" },
    sections: [],
    author: "Admin",
    updatedAt: "2026-02-20T10:00:00Z",
    publishedAt: "2026-02-01T10:00:00Z",
    scheduledAt: null
  },

  // ── Landing & campaign pages ───────────────────────────────────────────────
  {
    id: "page_dest_landing",
    title: "Destination Categories",
    slug: "destination-categories",
    pageType: "landing",
    templateKey: "blank_canvas",
    status: "draft",
    excerpt: "Browse wedding destinations by country and region.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: { title: "", metaDescription: "", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "", noindex: false, structuredDataType: "WebPage" },
    sections: [],
    author: "Admin",
    updatedAt: "2026-01-20T08:30:00Z",
    publishedAt: null,
    scheduledAt: null
  },
  {
    id: "page_003",
    title: "Summer Wedding Campaign 2026",
    slug: "summer-wedding-campaign-2026",
    pageType: "campaign",
    templateKey: "landing_page",
    status: "scheduled",
    excerpt: "Special offers for summer weddings.",
    featuredImage: "https://images.unsplash.com/photo-1519741497674-611481863552",
    heroVideoUrl: null,
    seo: { title: "Summer Wedding Campaign 2026 | Luxury Wedding Directory", metaDescription: "Get exclusive offers on luxury wedding venues for summer 2026.", canonicalUrl: "https://example.com/summer-wedding-campaign-2026", ogTitle: "Summer Wedding Campaign", ogDescription: "Exclusive summer wedding offers", ogImage: "https://images.unsplash.com/photo-1519741497674-611481863552", noindex: false, structuredDataType: "WebPage" },
    sections: [
      {
        id: "section_003", sectionType: "cta_band", sectionName: "Campaign CTA",
        position: 0, isVisible: true,
        content: { heading: "Book Your Dream Summer Wedding", body: "Limited availability on premium venues", ctaText: "Book Now", ctaUrl: "/contact" },
        settings: { paddingTop: 40, paddingBottom: 40, backgroundColor: "#8a6d1b", textAlign: "center", mobileVisible: true, desktopVisible: true }
      }
    ],
    author: "Admin",
    updatedAt: "2026-03-06T11:00:00Z",
    publishedAt: null,
    scheduledAt: "2026-06-01T00:00:00Z"
  },

  // ── Content / editorial ───────────────────────────────────────────────────
  {
    id: "page_002",
    title: "Our Wedding Planning Philosophy",
    slug: "wedding-planning-philosophy",
    pageType: "custom",
    templateKey: "hero_image",
    status: "draft",
    excerpt: "Learn how we approach luxury wedding planning.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: { title: "", metaDescription: "", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "", noindex: false, structuredDataType: "WebPage" },
    sections: [],
    author: "Admin",
    updatedAt: "2026-03-06T09:15:00Z",
    publishedAt: null,
    scheduledAt: null
  },
  {
    id: "page_004",
    title: "Blog Landing Page",
    slug: "blog",
    pageType: "blog_landing",
    templateKey: "editorial_long_form",
    status: "published",
    excerpt: "Latest wedding trends, tips, and inspiration.",
    featuredImage: null,
    heroVideoUrl: null,
    seo: { title: "Wedding Blog | Luxury Wedding Directory", metaDescription: "Read the latest wedding trends, tips, and inspiration from LWD.", canonicalUrl: "https://example.com/blog", ogTitle: "Wedding Blog", ogDescription: "Wedding trends and inspiration", ogImage: "", noindex: false, structuredDataType: "WebPage" },
    sections: [
      {
        id: "section_004", sectionType: "rich_text", sectionName: "Blog Intro",
        position: 0, isVisible: true,
        content: { heading: "Wedding Inspiration & Tips", body: "Discover the latest trends and expert tips for planning your luxury wedding.", image: null, ctaText: null, ctaUrl: null },
        settings: { paddingTop: 40, paddingBottom: 40, backgroundColor: "", textAlign: "center", mobileVisible: true, desktopVisible: true }
      }
    ],
    author: "Admin",
    updatedAt: "2026-02-28T15:45:00Z",
    publishedAt: "2026-01-15T10:00:00Z",
    scheduledAt: null
  },
];

export const getPageById       = (id)     => MOCK_PAGES.find(p => p.id === id);
export const getPagesByStatus  = (status) => MOCK_PAGES.filter(p => p.status === status);
export const getPagesByType    = (type)   => MOCK_PAGES.filter(p => p.pageType === type);
export const getPageBySlug     = (slug)   => MOCK_PAGES.find(p => p.slug === slug);
