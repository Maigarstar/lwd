/**
 * Page type definitions for Page Studio
 */

export const PAGE_TYPES = {
  homepage: {
    id: "homepage",
    label: "Homepage",
    description: "The main landing page of your site"
  },
  blog_landing: {
    id: "blog_landing",
    label: "Blog Landing Page",
    description: "Main blog index page with featured articles"
  },
  custom: {
    id: "custom",
    label: "Custom Static Page",
    description: "Custom page for any content"
  },
  campaign: {
    id: "campaign",
    label: "Campaign Page",
    description: "Promotional or seasonal campaign page"
  },
  destination: {
    id: "destination",
    label: "Destination Landing Page",
    description: "Landing page for a specific destination"
  },
  category: {
    id: "category",
    label: "Category Landing Page",
    description: "Category or collection page"
  },
  editorial: {
    id: "editorial",
    label: "Editorial Feature Page",
    description: "Long-form editorial content"
  },
  venue_profile: {
    id: "venue_profile",
    label: "Venue Profile",
    description: "Wedding venue listing page"
  },
  planner_profile: {
    id: "planner_profile",
    label: "Planner Profile",
    description: "Wedding planner listing page"
  },
  photographer_profile: {
    id: "photographer_profile",
    label: "Photographer Profile",
    description: "Wedding photographer listing page"
  },
  florist_profile: {
    id: "florist_profile",
    label: "Florist Profile",
    description: "Wedding florist listing page"
  },
  videographer_profile: {
    id: "videographer_profile",
    label: "Videographer Profile",
    description: "Wedding videographer listing page"
  },
  bridal_profile: {
    id: "bridal_profile",
    label: "Bridal Designer Profile",
    description: "Bridal wear & dress designer listing page"
  },
  rentals_profile: {
    id: "rentals_profile",
    label: "Rentals Profile",
    description: "Event rentals (decor, furniture, linens) listing page"
  },
  vendor_profile: {
    id: "vendor_profile",
    label: "Custom Vendor Profile",
    description: "Generic vendor/service provider listing page (create your own)"
  }
};

export const PAGE_TEMPLATES = {
  hero_image: {
    id: "hero_image",
    label: "Hero Image",
    description: "Simple hero with image background"
  },
  hero_video: {
    id: "hero_video",
    label: "Hero Video",
    description: "Hero with video background"
  },
  split_layout: {
    id: "split_layout",
    label: "Split Layout",
    description: "Side-by-side content and image layout"
  },
  editorial_long_form: {
    id: "editorial_long_form",
    label: "Editorial Long Form",
    description: "Long-form article template"
  },
  landing_page: {
    id: "landing_page",
    label: "Landing Page",
    description: "Conversion-focused landing page"
  },
  blank_canvas: {
    id: "blank_canvas",
    label: "Blank Canvas",
    description: "Start from scratch"
  }
};

export const SECTION_TYPES = {
  hero_image: {
    id: "hero_image",
    label: "Hero Image",
    category: "hero"
  },
  hero_video: {
    id: "hero_video",
    label: "Hero Video",
    category: "hero"
  },
  rich_text: {
    id: "rich_text",
    label: "Rich Text",
    category: "content"
  },
  two_column: {
    id: "two_column",
    label: "Two Column",
    category: "content"
  },
  cta_band: {
    id: "cta_band",
    label: "CTA Band",
    category: "features"
  },
  featured_cards: {
    id: "featured_cards",
    label: "Featured Cards Grid",
    category: "features"
  },
  faq: {
    id: "faq",
    label: "FAQ",
    category: "tools"
  },
  testimonial: {
    id: "testimonial",
    label: "Testimonial",
    category: "social"
  },
  spacer: {
    id: "spacer",
    label: "Spacer",
    category: "tools"
  }
};

export const PAGE_STATUSES = {
  draft: { id: "draft", label: "Draft", color: "blue" },
  published: { id: "published", label: "Published", color: "green" },
  scheduled: { id: "scheduled", label: "Scheduled", color: "blue" },
  archived: { id: "archived", label: "Archived", color: "grey" }
};
