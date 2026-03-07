/**
 * Mock section templates for different section types
 */

export const SECTION_TEMPLATES = {
  hero_image: {
    sectionType: "hero_image",
    sectionName: "Hero Image",
    content: {
      heading: "Section Heading",
      subheading: "Your subheading here",
      body: "",
      image: "",
      ctaText: "Learn More",
      ctaUrl: "#"
    },
    settings: {
      paddingTop: 60,
      paddingBottom: 40,
      backgroundColor: "",
      textAlign: "center",
      mobileVisible: true,
      desktopVisible: true
    }
  },

  hero_video: {
    sectionType: "hero_video",
    sectionName: "Hero Video",
    content: {
      heading: "Section Heading",
      subheading: "Your subheading here",
      body: "",
      videoUrl: "",
      ctaText: "Get Started",
      ctaUrl: "#"
    },
    settings: {
      paddingTop: 60,
      paddingBottom: 40,
      backgroundColor: "",
      textAlign: "center",
      mobileVisible: true,
      desktopVisible: true
    }
  },

  rich_text: {
    sectionType: "rich_text",
    sectionName: "Rich Text",
    content: {
      heading: "Heading",
      body: "Add your rich text content here.",
      image: "",
      ctaText: "",
      ctaUrl: ""
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      textAlign: "left",
      mobileVisible: true,
      desktopVisible: true
    }
  },

  two_column: {
    sectionType: "two_column",
    sectionName: "Two Column",
    content: {
      heading: "Two Column Section",
      leftHeading: "Left Column",
      leftBody: "Add your left column content here.",
      rightHeading: "Right Column",
      rightBody: "Add your right column content here.",
      leftImage: "",
      rightImage: "",
      ctaText: "",
      ctaUrl: ""
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      textAlign: "left",
      mobileVisible: true,
      desktopVisible: true
    }
  },

  cta_band: {
    sectionType: "cta_band",
    sectionName: "CTA Band",
    content: {
      heading: "Call to Action",
      body: "Inspire your visitors to take action.",
      ctaText: "Click Here",
      ctaUrl: "#",
      image: ""
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "#8a6d1b",
      textAlign: "center",
      mobileVisible: true,
      desktopVisible: true
    }
  },

  featured_cards: {
    sectionType: "featured_cards",
    sectionName: "Featured Cards Grid",
    content: {
      heading: "Featured Cards",
      cards: [
        {
          id: "card_1",
          title: "Card Title",
          description: "Card description",
          image: "",
          ctaText: "Learn More",
          ctaUrl: "#"
        },
        {
          id: "card_2",
          title: "Card Title",
          description: "Card description",
          image: "",
          ctaText: "Learn More",
          ctaUrl: "#"
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
    }
  },

  faq: {
    sectionType: "faq",
    sectionName: "FAQ",
    content: {
      heading: "Frequently Asked Questions",
      faqs: [
        {
          id: "faq_1",
          question: "What is your planning timeline?",
          answer: "We recommend booking 12-18 months in advance for premium venues."
        },
        {
          id: "faq_2",
          question: "Do you offer international destinations?",
          answer: "Yes, we offer curated venues across Europe and beyond."
        }
      ]
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      mobileVisible: true,
      desktopVisible: true
    }
  },

  testimonial: {
    sectionType: "testimonial",
    sectionName: "Testimonial",
    content: {
      quote: "An amazing experience from start to finish.",
      author: "Client Name",
      role: "Bride & Groom",
      image: "",
      rating: 5
    },
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      textAlign: "center",
      mobileVisible: true,
      desktopVisible: true
    }
  },

  spacer: {
    sectionType: "spacer",
    sectionName: "Spacer",
    content: {},
    settings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "",
      height: 40,
      mobileVisible: true,
      desktopVisible: true
    }
  }
};

export const getSectionTemplate = (sectionType) => SECTION_TEMPLATES[sectionType];
