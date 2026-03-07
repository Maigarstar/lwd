/**
 * Mock reusable blocks for Phase 1 development
 */

export const MOCK_BLOCKS = [
  {
    id: "block_001",
    name: "Newsletter Signup CTA",
    blockType: "cta_band",
    description: "Call-to-action block for newsletter signups",
    usageCount: 3,
    content: {
      heading: "Join Our Newsletter",
      body: "Get the latest wedding trends and inspiration delivered to your inbox.",
      ctaText: "Subscribe",
      ctaUrl: "/newsletter",
      image: ""
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "#8a6d1b",
      textAlign: "center",
      mobileVisible: true,
      desktopVisible: true
    },
    createdAt: "2026-02-15T10:00:00Z"
  },
  {
    id: "block_002",
    name: "Trust & Credibility Strip",
    blockType: "featured_cards",
    description: "Display credentials and trust signals",
    usageCount: 2,
    content: {
      heading: "Why Choose Us",
      cards: [
        {
          id: "card_1",
          title: "10+ Years",
          description: "Of wedding planning experience",
          image: "",
          ctaText: null,
          ctaUrl: null
        },
        {
          id: "card_2",
          title: "500+ Venues",
          description: "Curated luxury destinations",
          image: "",
          ctaText: null,
          ctaUrl: null
        },
        {
          id: "card_3",
          title: "1000+ Weddings",
          description: "Successfully planned and executed",
          image: "",
          ctaText: null,
          ctaUrl: null
        }
      ]
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      columns: 3,
      mobileVisible: true,
      desktopVisible: true
    },
    createdAt: "2026-02-10T14:30:00Z"
  },
  {
    id: "block_003",
    name: "Testimonial Band",
    blockType: "testimonial",
    description: "Client testimonial with photo",
    usageCount: 1,
    content: {
      quote: "Working with this team was absolutely magical. They understood our vision and executed it flawlessly.",
      author: "Sarah & James",
      role: "Married in Lake Como 2025",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552",
      rating: 5
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      textAlign: "center",
      mobileVisible: true,
      desktopVisible: true
    },
    createdAt: "2026-01-20T09:15:00Z"
  },
  {
    id: "block_004",
    name: "FAQ - Common Planning Questions",
    blockType: "faq",
    description: "Frequently asked questions about wedding planning",
    usageCount: 2,
    content: {
      heading: "Common Questions",
      faqs: [
        {
          id: "faq_1",
          question: "How far in advance should we book?",
          answer: "We recommend booking 12-18 months in advance for premium venues."
        },
        {
          id: "faq_2",
          question: "What's included in planning services?",
          answer: "Full coordination, vendor selection, timeline management, and day-of execution."
        },
        {
          id: "faq_3",
          question: "Do you work with international clients?",
          answer: "Yes, we specialize in destination weddings across Europe."
        }
      ]
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      mobileVisible: true,
      desktopVisible: true
    },
    createdAt: "2026-01-10T11:00:00Z"
  },
  {
    id: "block_005",
    name: "Featured Venues Showcase",
    blockType: "featured_cards",
    description: "Showcase premium venue options",
    usageCount: 1,
    content: {
      heading: "Featured Venues",
      cards: [
        {
          id: "venue_1",
          title: "Villa d'Este",
          description: "Lakeside palazzo with terrace views",
          image: "https://images.unsplash.com/photo-1519741497674-611481863552",
          ctaText: "View Details",
          ctaUrl: "/venues/villa-deste"
        },
        {
          id: "venue_2",
          title: "Castello di Roncolo",
          description: "Medieval castle wedding venue",
          image: "https://images.unsplash.com/photo-1519741497674-611481863552",
          ctaText: "View Details",
          ctaUrl: "/venues/castello-di-roncolo"
        }
      ]
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      columns: 2,
      mobileVisible: true,
      desktopVisible: true
    },
    createdAt: "2026-01-05T15:45:00Z"
  }
];

export const getBlockById = (id) => MOCK_BLOCKS.find(b => b.id === id);
export const getBlocksByType = (type) => MOCK_BLOCKS.filter(b => b.blockType === type);
