/**
 * Universal Section Registry
 * Single source of truth for all section types, their fields, defaults, and configurations
 * Used by Page Studio, Homepage Manager, Reusable Blocks, and AI page generation
 */

// Field type definitions for validation and UI rendering
const FIELD_TYPES = {
  TEXT: "text",
  TEXTAREA: "textarea",
  RICHTEXT: "richtext",
  IMAGE: "image",
  VIDEO: "video",
  SELECT: "select",
  CHECKBOX: "checkbox",
  NUMBER: "number",
  COLOR: "color",
  URL: "url",
  DATE: "date",
  MULTISELECT: "multiselect",
  GRID: "grid"
};

// Field group structure for organizing fields into tabs
const FIELD_GROUPS = {
  CONTENT: "content",
  STYLE: "style",
  ADVANCED: "advanced"
};

/**
 * Field definition schema
 * Defines structure of any field in the registry
 */
const createField = (config) => ({
  name: config.name, // Field key/identifier
  label: config.label, // Human-readable label
  type: config.type, // From FIELD_TYPES
  group: config.group || FIELD_GROUPS.CONTENT, // Tab assignment
  default: config.default !== undefined ? config.default : "", // Default value
  placeholder: config.placeholder || "", // Placeholder text
  help: config.help || "", // Helper text
  required: config.required || false, // Validation: required
  maxLength: config.maxLength || null, // Validation: text length
  min: config.min || null, // Validation: numeric min
  max: config.max || null, // Validation: numeric max
  pattern: config.pattern || null, // Validation: regex pattern
  options: config.options || [], // For select/multiselect: [{ value, label }]
  characterCount: config.characterCount || false, // Show char counter (for title, description)
  richTextButtons: config.richTextButtons || ["bold", "italic", "link", "list"], // RTE toolbar buttons
  tooltip: config.tooltip || "", // Additional tooltip/guidance
  conditional: config.conditional || null, // Show if condition met: { field, equals, value }
  uiHint: config.uiHint || null, // "wide" | "narrow" | "full" | null
  aiEnabled: config.aiEnabled || false // Can use AI to generate content
});

/**
 * Section type registry
 * Defines all section types with their complete configuration
 */
export const SECTION_REGISTRY = {
  // ============================================================================
  // HERO SECTIONS
  // ============================================================================

  hero_image: {
    id: "hero_image",
    name: "Hero Image",
    category: "hero",
    icon: "🖼️",
    description: "Large image with text overlay and CTA button",
    defaultContent: {
      heading: "Hero Heading",
      subheading: "Secondary text here",
      image: "",
      ctaText: "Learn More",
      ctaUrl: "#",
      ctaTarget: "_self"
    },
    defaultSettings: {
      paddingTop: 60,
      paddingBottom: 60,
      backgroundColor: "#000000",
      textColor: "#ffffff",
      overlayOpacity: 0.4,
      minHeight: 500,
      mobileVisible: true,
      desktopVisible: true,
      imagePosition: "center" // center, top, bottom
    },
    fields: [
      // CONTENT TAB
      createField({
        name: "heading",
        label: "Hero Heading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Hero Heading",
        placeholder: "Enter hero headline",
        help: "Main headline for the hero section",
        maxLength: 100,
        characterCount: true,
        required: true,
        aiEnabled: true
      }),
      createField({
        name: "subheading",
        label: "Subheading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Secondary text here",
        placeholder: "Enter subheading",
        help: "Secondary text below headline",
        maxLength: 160,
        characterCount: true,
        aiEnabled: true
      }),
      createField({
        name: "image",
        label: "Hero Image",
        type: FIELD_TYPES.IMAGE,
        group: FIELD_GROUPS.CONTENT,
        help: "Recommended: 1920x1080px, minimum 1200x800px",
        required: true
      }),
      createField({
        name: "ctaText",
        label: "Button Text",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Learn More",
        maxLength: 30
      }),
      createField({
        name: "ctaUrl",
        label: "Button URL",
        type: FIELD_TYPES.URL,
        group: FIELD_GROUPS.CONTENT,
        default: "#"
      }),
      // STYLE TAB
      createField({
        name: "overlayOpacity",
        label: "Overlay Opacity",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.STYLE,
        default: 0.4,
        min: 0,
        max: 1,
        help: "Darkness of overlay (0 = transparent, 1 = opaque)"
      }),
      createField({
        name: "textColor",
        label: "Text Color",
        type: FIELD_TYPES.COLOR,
        group: FIELD_GROUPS.STYLE,
        default: "#ffffff"
      }),
      createField({
        name: "minHeight",
        label: "Section Height (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.STYLE,
        default: 500,
        min: 300,
        max: 1000
      }),
      createField({
        name: "imagePosition",
        label: "Image Position",
        type: FIELD_TYPES.SELECT,
        group: FIELD_GROUPS.STYLE,
        default: "center",
        options: [
          { value: "top", label: "Top" },
          { value: "center", label: "Center" },
          { value: "bottom", label: "Bottom" }
        ]
      }),
      // ADVANCED TAB
      createField({
        name: "paddingTop",
        label: "Padding Top (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 60,
        min: 0,
        max: 200
      }),
      createField({
        name: "paddingBottom",
        label: "Padding Bottom (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 60,
        min: 0,
        max: 200
      }),
      createField({
        name: "backgroundColor",
        label: "Section Background",
        type: FIELD_TYPES.COLOR,
        group: FIELD_GROUPS.ADVANCED,
        default: "#000000"
      }),
      createField({
        name: "mobileVisible",
        label: "Show on Mobile",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.ADVANCED,
        default: true
      }),
      createField({
        name: "desktopVisible",
        label: "Show on Desktop",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.ADVANCED,
        default: true
      })
    ]
  },

  hero_video: {
    id: "hero_video",
    name: "Hero Video",
    category: "hero",
    icon: "🎬",
    description: "Full-screen video background with text overlay",
    defaultContent: {
      heading: "Video Hero Section",
      subheading: "Compelling subtitle",
      videoUrl: "",
      posterImage: "",
      ctaText: "Get Started",
      ctaUrl: "#"
    },
    defaultSettings: {
      paddingTop: 60,
      paddingBottom: 60,
      minHeight: 600,
      overlayOpacity: 0.5,
      mobileVisible: true,
      desktopVisible: true,
      autoplay: true,
      muted: true,
      loop: true
    },
    fields: [
      createField({
        name: "heading",
        label: "Hero Heading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Video Hero Section",
        maxLength: 100,
        characterCount: true,
        required: true
      }),
      createField({
        name: "subheading",
        label: "Subheading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Compelling subtitle",
        maxLength: 160
      }),
      createField({
        name: "videoUrl",
        label: "Video URL",
        type: FIELD_TYPES.VIDEO,
        group: FIELD_GROUPS.CONTENT,
        help: "MP4, WebM, or Vimeo/YouTube URL",
        required: true
      }),
      createField({
        name: "posterImage",
        label: "Poster Image",
        type: FIELD_TYPES.IMAGE,
        group: FIELD_GROUPS.CONTENT,
        help: "Shows before video loads"
      }),
      createField({
        name: "ctaText",
        label: "Button Text",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Get Started",
        maxLength: 30
      }),
      createField({
        name: "ctaUrl",
        label: "Button URL",
        type: FIELD_TYPES.URL,
        group: FIELD_GROUPS.CONTENT,
        default: "#"
      }),
      createField({
        name: "overlayOpacity",
        label: "Overlay Opacity",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.STYLE,
        default: 0.5,
        min: 0,
        max: 1
      }),
      createField({
        name: "minHeight",
        label: "Section Height (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.STYLE,
        default: 600,
        min: 300,
        max: 1000
      }),
      createField({
        name: "autoplay",
        label: "Autoplay",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.ADVANCED,
        default: true
      }),
      createField({
        name: "muted",
        label: "Muted",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.ADVANCED,
        default: true,
        help: "Required for autoplay on most browsers"
      }),
      createField({
        name: "loop",
        label: "Loop",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.ADVANCED,
        default: true
      })
    ]
  },

  // ============================================================================
  // CONTENT SECTIONS
  // ============================================================================

  rich_text: {
    id: "rich_text",
    name: "Rich Text",
    category: "content",
    icon: "✍️",
    description: "Flexible text content with rich formatting",
    defaultContent: {
      heading: "Section Heading",
      body: "Add your content here",
      alignment: "left"
    },
    defaultSettings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "transparent",
      textColor: "#1a1a1a",
      maxWidth: 800,
      mobileVisible: true,
      desktopVisible: true
    },
    fields: [
      createField({
        name: "heading",
        label: "Heading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Section Heading",
        maxLength: 100,
        characterCount: true
      }),
      createField({
        name: "body",
        label: "Content",
        type: FIELD_TYPES.RICHTEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Add your content here",
        richTextButtons: ["bold", "italic", "link", "list", "heading"],
        aiEnabled: true
      }),
      createField({
        name: "alignment",
        label: "Text Alignment",
        type: FIELD_TYPES.SELECT,
        group: FIELD_GROUPS.STYLE,
        default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" }
        ]
      }),
      createField({
        name: "textColor",
        label: "Text Color",
        type: FIELD_TYPES.COLOR,
        group: FIELD_GROUPS.STYLE,
        default: "#1a1a1a"
      }),
      createField({
        name: "paddingTop",
        label: "Padding Top (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40,
        min: 0,
        max: 200
      }),
      createField({
        name: "paddingBottom",
        label: "Padding Bottom (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40,
        min: 0,
        max: 200
      }),
      createField({
        name: "backgroundColor",
        label: "Background Color",
        type: FIELD_TYPES.COLOR,
        group: FIELD_GROUPS.ADVANCED,
        default: "transparent"
      })
    ]
  },

  two_column: {
    id: "two_column",
    name: "Two Column",
    category: "content",
    icon: "☲",
    description: "Two-column layout with image and text",
    defaultContent: {
      heading: "Two Column Section",
      leftText: "Left column content",
      rightText: "Right column content",
      image: "",
      imagePosition: "left" // left or right
    },
    defaultSettings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "transparent",
      columnGap: 40,
      mobileVisible: true,
      desktopVisible: true
    },
    fields: [
      createField({
        name: "heading",
        label: "Section Heading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Two Column Section",
        maxLength: 100
      }),
      createField({
        name: "image",
        label: "Column Image",
        type: FIELD_TYPES.IMAGE,
        group: FIELD_GROUPS.CONTENT,
        help: "Recommended: 600x400px"
      }),
      createField({
        name: "imagePosition",
        label: "Image Position",
        type: FIELD_TYPES.SELECT,
        group: FIELD_GROUPS.CONTENT,
        default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" }
        ]
      }),
      createField({
        name: "leftText",
        label: "Left Column",
        type: FIELD_TYPES.RICHTEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Left column content"
      }),
      createField({
        name: "rightText",
        label: "Right Column",
        type: FIELD_TYPES.RICHTEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Right column content"
      }),
      createField({
        name: "columnGap",
        label: "Column Gap (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.STYLE,
        default: 40,
        min: 0,
        max: 100
      }),
      createField({
        name: "paddingTop",
        label: "Padding Top (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40,
        min: 0,
        max: 200
      }),
      createField({
        name: "paddingBottom",
        label: "Padding Bottom (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40,
        min: 0,
        max: 200
      })
    ]
  },

  // ============================================================================
  // FEATURE/GRID SECTIONS
  // ============================================================================

  cta_band: {
    id: "cta_band",
    name: "CTA Band",
    category: "features",
    icon: "📣",
    description: "Bold call-to-action section with background",
    defaultContent: {
      heading: "Ready to Get Started?",
      subheading: "Take the next step with us",
      ctaText: "Start Now",
      ctaUrl: "#"
    },
    defaultSettings: {
      paddingTop: 60,
      paddingBottom: 60,
      backgroundColor: "#8a6d1b",
      textColor: "#ffffff",
      alignment: "center",
      mobileVisible: true,
      desktopVisible: true
    },
    fields: [
      createField({
        name: "heading",
        label: "Heading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Ready to Get Started?",
        maxLength: 80,
        characterCount: true,
        required: true,
        aiEnabled: true
      }),
      createField({
        name: "subheading",
        label: "Subheading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Take the next step with us",
        maxLength: 160
      }),
      createField({
        name: "ctaText",
        label: "Button Text",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Start Now",
        maxLength: 30,
        required: true
      }),
      createField({
        name: "ctaUrl",
        label: "Button URL",
        type: FIELD_TYPES.URL,
        group: FIELD_GROUPS.CONTENT,
        default: "#",
        required: true
      }),
      createField({
        name: "alignment",
        label: "Text Alignment",
        type: FIELD_TYPES.SELECT,
        group: FIELD_GROUPS.STYLE,
        default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" }
        ]
      }),
      createField({
        name: "backgroundColor",
        label: "Background Color",
        type: FIELD_TYPES.COLOR,
        group: FIELD_GROUPS.STYLE,
        default: "#8a6d1b"
      }),
      createField({
        name: "textColor",
        label: "Text Color",
        type: FIELD_TYPES.COLOR,
        group: FIELD_GROUPS.STYLE,
        default: "#ffffff"
      }),
      createField({
        name: "paddingTop",
        label: "Padding Top (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 60,
        min: 0,
        max: 200
      }),
      createField({
        name: "paddingBottom",
        label: "Padding Bottom (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 60,
        min: 0,
        max: 200
      })
    ]
  },

  featured_cards: {
    id: "featured_cards",
    name: "Featured Cards",
    category: "features",
    icon: "🃏",
    description: "Grid of feature cards with images and text",
    defaultContent: {
      heading: "Why Choose Us",
      cards: [
        {
          id: "card_1",
          title: "Card One",
          description: "Feature description",
          image: "",
          icon: "⭐"
        },
        {
          id: "card_2",
          title: "Card Two",
          description: "Feature description",
          image: "",
          icon: "⭐"
        }
      ]
    },
    defaultSettings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "transparent",
      gridColumns: 3,
      cardStyle: "standard", // standard | minimal | elevated
      mobileVisible: true,
      desktopVisible: true
    },
    fields: [
      createField({
        name: "heading",
        label: "Section Heading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Why Choose Us",
        maxLength: 100
      }),
      createField({
        name: "gridColumns",
        label: "Grid Columns",
        type: FIELD_TYPES.SELECT,
        group: FIELD_GROUPS.STYLE,
        default: 3,
        options: [
          { value: 2, label: "2 Columns" },
          { value: 3, label: "3 Columns" },
          { value: 4, label: "4 Columns" }
        ]
      }),
      createField({
        name: "cardStyle",
        label: "Card Style",
        type: FIELD_TYPES.SELECT,
        group: FIELD_GROUPS.STYLE,
        default: "standard",
        options: [
          { value: "standard", label: "Standard" },
          { value: "minimal", label: "Minimal" },
          { value: "elevated", label: "Elevated" }
        ]
      }),
      createField({
        name: "paddingTop",
        label: "Padding Top (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40
      }),
      createField({
        name: "paddingBottom",
        label: "Padding Bottom (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40
      })
    ]
  },

  // ============================================================================
  // SOCIAL/INTERACTIVE SECTIONS
  // ============================================================================

  testimonial: {
    id: "testimonial",
    name: "Testimonial",
    category: "social",
    icon: "💬",
    description: "Client testimonial with quote, author, and image",
    defaultContent: {
      quote: "This is an amazing testimonial about our service.",
      author: "Client Name",
      title: "Client Title",
      company: "Company Name",
      image: "",
      rating: 5
    },
    defaultSettings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "transparent",
      alignment: "center",
      mobileVisible: true,
      desktopVisible: true,
      showRating: true,
      layout: "center" // left | center | right
    },
    fields: [
      createField({
        name: "quote",
        label: "Testimonial Quote",
        type: FIELD_TYPES.TEXTAREA,
        group: FIELD_GROUPS.CONTENT,
        default: "This is an amazing testimonial about our service.",
        maxLength: 300,
        characterCount: true,
        required: true
      }),
      createField({
        name: "author",
        label: "Author Name",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Client Name",
        maxLength: 50,
        required: true
      }),
      createField({
        name: "title",
        label: "Author Title",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Client Title",
        maxLength: 50
      }),
      createField({
        name: "company",
        label: "Company Name",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Company Name",
        maxLength: 50
      }),
      createField({
        name: "image",
        label: "Author Image",
        type: FIELD_TYPES.IMAGE,
        group: FIELD_GROUPS.CONTENT,
        help: "Recommended: 200x200px (square)"
      }),
      createField({
        name: "rating",
        label: "Rating (Stars)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.STYLE,
        default: 5,
        min: 1,
        max: 5
      }),
      createField({
        name: "showRating",
        label: "Show Star Rating",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.STYLE,
        default: true
      }),
      createField({
        name: "layout",
        label: "Layout",
        type: FIELD_TYPES.SELECT,
        group: FIELD_GROUPS.STYLE,
        default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" }
        ]
      })
    ]
  },

  faq: {
    id: "faq",
    name: "FAQ",
    category: "social",
    icon: "❓",
    description: "Frequently asked questions accordion",
    defaultContent: {
      heading: "Frequently Asked Questions",
      items: [
        {
          id: "faq_1",
          question: "What is your first question?",
          answer: "Here is the answer to the first question."
        },
        {
          id: "faq_2",
          question: "What is your second question?",
          answer: "Here is the answer to the second question."
        }
      ]
    },
    defaultSettings: {
      paddingTop: 40,
      paddingBottom: 40,
      backgroundColor: "transparent",
      accentColor: "#8a6d1b",
      mobileVisible: true,
      desktopVisible: true
    },
    fields: [
      createField({
        name: "heading",
        label: "Section Heading",
        type: FIELD_TYPES.TEXT,
        group: FIELD_GROUPS.CONTENT,
        default: "Frequently Asked Questions",
        maxLength: 100
      }),
      createField({
        name: "accentColor",
        label: "Accent Color",
        type: FIELD_TYPES.COLOR,
        group: FIELD_GROUPS.STYLE,
        default: "#8a6d1b"
      }),
      createField({
        name: "paddingTop",
        label: "Padding Top (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40
      }),
      createField({
        name: "paddingBottom",
        label: "Padding Bottom (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.ADVANCED,
        default: 40
      })
    ]
  },

  // ============================================================================
  // UTILITY SECTIONS
  // ============================================================================

  spacer: {
    id: "spacer",
    name: "Spacer",
    category: "utility",
    icon: "⬇️",
    description: "Empty space for layout rhythm",
    defaultContent: {},
    defaultSettings: {
      height: 60,
      mobileVisible: true,
      desktopVisible: true
    },
    fields: [
      createField({
        name: "height",
        label: "Height (px)",
        type: FIELD_TYPES.NUMBER,
        group: FIELD_GROUPS.CONTENT,
        default: 60,
        min: 20,
        max: 500
      }),
      createField({
        name: "mobileVisible",
        label: "Show on Mobile",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.ADVANCED,
        default: true
      }),
      createField({
        name: "desktopVisible",
        label: "Show on Desktop",
        type: FIELD_TYPES.CHECKBOX,
        group: FIELD_GROUPS.ADVANCED,
        default: true
      })
    ]
  }
};

/**
 * Get section type by ID
 */
export const getSectionType = (sectionId) => {
  return SECTION_REGISTRY[sectionId] || null;
};

/**
 * Get all section types
 */
export const getAllSectionTypes = () => {
  return Object.values(SECTION_REGISTRY);
};

/**
 * Get section types by category
 */
export const getSectionsByCategory = (category) => {
  return Object.values(SECTION_REGISTRY).filter((s) => s.category === category);
};

/**
 * Get unique categories
 */
export const getCategories = () => {
  const categories = new Set();
  Object.values(SECTION_REGISTRY).forEach((section) => {
    categories.add(section.category);
  });
  return Array.from(categories);
};

/**
 * Get fields for a section, optionally filtered by group (tab)
 */
export const getSectionFields = (sectionId, groupFilter = null) => {
  const section = getSectionType(sectionId);
  if (!section) return [];

  if (groupFilter) {
    return section.fields.filter((f) => f.group === groupFilter);
  }
  return section.fields;
};

/**
 * Get field groups (tabs) for a section
 */
export const getFieldGroups = (sectionId) => {
  const fields = getSectionFields(sectionId);
  const groups = new Set();
  fields.forEach((f) => {
    groups.add(f.group);
  });
  // Return in consistent order: content, style, advanced
  const ordered = [];
  if (groups.has(FIELD_GROUPS.CONTENT)) ordered.push(FIELD_GROUPS.CONTENT);
  if (groups.has(FIELD_GROUPS.STYLE)) ordered.push(FIELD_GROUPS.STYLE);
  if (groups.has(FIELD_GROUPS.ADVANCED)) ordered.push(FIELD_GROUPS.ADVANCED);
  return ordered;
};

/**
 * Create new section instance with defaults
 */
export const createNewSection = (sectionId, overrides = {}) => {
  const sectionType = getSectionType(sectionId);
  if (!sectionType) return null;

  return {
    id: `section_${Date.now()}`,
    sectionType: sectionId,
    sectionName: sectionType.name,
    position: 0,
    isVisible: true,
    content: {
      ...sectionType.defaultContent,
      ...overrides.content
    },
    settings: {
      ...sectionType.defaultSettings,
      ...overrides.settings
    }
  };
};

/**
 * Validate section data against registry schema
 */
export const validateSection = (sectionId, sectionData) => {
  const sectionType = getSectionType(sectionId);
  if (!sectionType) return { valid: false, errors: ["Section type not found"] };

  const errors = [];
  const fields = sectionType.fields;

  fields.forEach((field) => {
    const value = sectionData.content?.[field.name] ?? sectionData.settings?.[field.name];

    // Check required
    if (field.required && !value) {
      errors.push(`${field.label} is required`);
    }

    // Check string length
    if (field.maxLength && typeof value === "string" && value.length > field.maxLength) {
      errors.push(`${field.label} exceeds maximum length of ${field.maxLength}`);
    }

    // Check numeric bounds
    if (typeof value === "number") {
      if (field.min !== null && value < field.min) {
        errors.push(`${field.label} must be at least ${field.min}`);
      }
      if (field.max !== null && value > field.max) {
        errors.push(`${field.label} cannot exceed ${field.max}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export const FIELD_TYPES_EXPORT = FIELD_TYPES;
export const FIELD_GROUPS_EXPORT = FIELD_GROUPS;

export default SECTION_REGISTRY;
