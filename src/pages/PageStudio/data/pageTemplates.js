/**
 * Page Templates - Pre-configured section layouts for different page types
 * Auto-populate CreatePageModule with recommended sections
 */

import { getSectionTemplate } from "./mockSections";

/**
 * Template definitions for each page type
 * Each template includes a list of sections to pre-populate the page
 */
export const PAGE_TEMPLATES = {
  homepage: {
    name: "Homepage",
    description: "Landing page showcasing venues and planners",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Hero Slider",
        order: 0
      },
      {
        sectionType: "featured_cards",
        sectionName: "Featured Collections",
        order: 1
      },
      {
        sectionType: "cta_band",
        sectionName: "Browse Venues CTA",
        order: 2
      }
    ]
  },

  blog_landing: {
    name: "Blog Landing",
    description: "Blog index with articles and categories",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Blog Hero",
        order: 0
      },
      {
        sectionType: "featured_cards",
        sectionName: "Latest Articles",
        order: 1
      },
      {
        sectionType: "testimonial",
        sectionName: "Reader Testimonials",
        order: 2
      }
    ]
  },

  destination: {
    name: "Destination Landing",
    description: "Country/destination page with venues and planners",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Destination Hero",
        content: {
          heading: "Weddings in {destination}",
          subheading: "Discover luxury venues and expert planners"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "Backdrop Selection",
        content: {
          heading: "Choose your backdrop",
          body: "Filter venues by style and location"
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Featured Story",
        content: {
          heading: "The Art of {destination} Weddings"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Latest Venues",
        content: {
          heading: "Latest Venues"
        },
        order: 3
      },
      {
        sectionType: "rich_text",
        sectionName: "Signature Collection",
        content: {
          heading: "The Signature Collection",
          body: "Curated luxury venues in {destination}"
        },
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Inspirational Quote",
        content: {
          heading: "{destination}, where every moment becomes a memory",
          body: "Create unforgettable wedding experiences"
        },
        order: 5
      },
      {
        sectionType: "featured_cards",
        sectionName: "Latest Planners",
        content: {
          heading: "Expert Planners"
        },
        order: 6
      },
      {
        sectionType: "rich_text",
        sectionName: "Planning Guide",
        content: {
          heading: "Planning Your {destination} Wedding",
          body: "Expert tips and inspiration for your special day"
        },
        order: 7
      },
      {
        sectionType: "faq",
        sectionName: "Common Questions",
        order: 8
      },
      {
        sectionType: "cta_band",
        sectionName: "Explore Regions",
        content: {
          heading: "Browse {destination} Regions",
          ctaText: "View All Regions"
        },
        order: 9
      }
    ]
  },

  vendor_highlight: {
    name: "Vendor Highlight",
    description: "Showcase a specific venue or planner",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Vendor Hero",
        content: {
          heading: "Venue Name",
          subheading: "Location • Wedding Services"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "Vendor Story",
        content: {
          heading: "Our Story",
          body: "Tell the story of this venue or planner"
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Image Gallery",
        content: {
          heading: "Photo Gallery"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Amenities",
        content: {
          heading: "Features & Amenities"
        },
        order: 3
      },
      {
        sectionType: "testimonial",
        sectionName: "Client Testimonials",
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Location & Details",
        content: {
          heading: "Location & Accommodations"
        },
        order: 5
      },
      {
        sectionType: "faq",
        sectionName: "Vendor FAQs",
        order: 6
      },
      {
        sectionType: "cta_band",
        sectionName: "Inquiry CTA",
        content: {
          heading: "Ready to Plan Your Wedding Here?",
          subheading: "Contact us for availability and pricing",
          ctaText: "Request Inquiry"
        },
        order: 7
      }
    ]
  },

  category: {
    name: "Category Landing",
    description: "Browse venues or services by category",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Category Hero",
        order: 0
      },
      {
        sectionType: "featured_cards",
        sectionName: "Items in Category",
        order: 1
      },
      {
        sectionType: "cta_band",
        sectionName: "Browse More CTA",
        order: 2
      }
    ]
  },

  editorial: {
    name: "Editorial Feature",
    description: "Long-form editorial content and storytelling",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Article Hero",
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "Article Content",
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Related Content",
        order: 2
      }
    ]
  },

  custom: {
    name: "Blank Canvas",
    description: "Start from scratch",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Hero Section",
        order: 0
      }
    ]
  },

  venue_profile: {
    name: "Venue Profile",
    description: "Customizable wedding venue listing page",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Venue Hero",
        content: {
          heading: "{vendor}",
          subheading: "Luxury Wedding Venue"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "About Venue",
        content: {
          heading: "About {vendor}",
          body: "Discover the story and unique character of this exceptional wedding venue."
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Photo Gallery",
        content: {
          heading: "Gallery"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Amenities & Features",
        content: {
          heading: "Features & Amenities"
        },
        order: 3
      },
      {
        sectionType: "testimonial",
        sectionName: "Client Testimonials",
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Location & Accommodations",
        content: {
          heading: "Location & Guest Accommodations"
        },
        order: 5
      },
      {
        sectionType: "faq",
        sectionName: "Venue FAQs",
        order: 6
      },
      {
        sectionType: "cta_band",
        sectionName: "Inquiry CTA",
        content: {
          heading: "Ready to Plan Your Wedding Here?",
          subheading: "Contact us for availability and pricing",
          ctaText: "Request Inquiry"
        },
        order: 7
      }
    ]
  },

  planner_profile: {
    name: "Planner Profile",
    description: "Customizable wedding planner listing page",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Planner Hero",
        content: {
          heading: "{vendor}",
          subheading: "Expert Wedding Planner"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "About Planner",
        content: {
          heading: "Our Planning Philosophy",
          body: "Learn about our approach to creating unforgettable wedding experiences."
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Services Offered",
        content: {
          heading: "Services"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Real Weddings Portfolio",
        content: {
          heading: "Portfolio"
        },
        order: 3
      },
      {
        sectionType: "testimonial",
        sectionName: "Client Testimonials",
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Why Choose Us",
        content: {
          heading: "Why Couples Choose {vendor}",
          body: "Discover what makes this planning team special."
        },
        order: 5
      },
      {
        sectionType: "faq",
        sectionName: "Planning FAQs",
        order: 6
      },
      {
        sectionType: "cta_band",
        sectionName: "Consultation CTA",
        content: {
          heading: "Ready to Plan Your Dream Wedding?",
          subheading: "Schedule a consultation with our team",
          ctaText: "Book Consultation"
        },
        order: 7
      }
    ]
  },

  photographer_profile: {
    name: "Photographer Profile",
    description: "Customizable wedding photographer listing page",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Photographer Hero",
        content: {
          heading: "{vendor}",
          subheading: "Wedding Photography"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "About Photographer",
        content: {
          heading: "Our Photography Style",
          body: "Explore the unique vision and approach to capturing your wedding day."
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Photography Galleries",
        content: {
          heading: "Collections"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Recent Weddings",
        content: {
          heading: "Recent Collections"
        },
        order: 3
      },
      {
        sectionType: "testimonial",
        sectionName: "Client Reviews",
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Packages & Pricing",
        content: {
          heading: "Photography Packages",
          body: "Our range of coverage options and packages to suit every wedding."
        },
        order: 5
      },
      {
        sectionType: "faq",
        sectionName: "Photography FAQs",
        order: 6
      },
      {
        sectionType: "cta_band",
        sectionName: "Booking CTA",
        content: {
          heading: "Let's Capture Your Love Story",
          subheading: "Check availability and discuss your photography needs",
          ctaText: "Get in Touch"
        },
        order: 7
      }
    ]
  },

  videographer_profile: {
    name: "Videographer Profile",
    description: "Customizable wedding videographer listing page",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Videographer Hero",
        content: {
          heading: "{vendor}",
          subheading: "Wedding Videography"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "About Videographer",
        content: {
          heading: "Our Cinematic Vision",
          body: "Discover our storytelling approach to wedding videography."
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Video Reel Collections",
        content: {
          heading: "Featured Videos"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Recent Films",
        content: {
          heading: "Wedding Films"
        },
        order: 3
      },
      {
        sectionType: "testimonial",
        sectionName: "Client Testimonials",
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Packages & Services",
        content: {
          heading: "Videography Packages",
          body: "Choose from our range of video coverage and editing services."
        },
        order: 5
      },
      {
        sectionType: "faq",
        sectionName: "Videography FAQs",
        order: 6
      },
      {
        sectionType: "cta_band",
        sectionName: "Booking CTA",
        content: {
          heading: "Let's Tell Your Love Story on Film",
          subheading: "Book a consultation to discuss your vision",
          ctaText: "Book Now"
        },
        order: 7
      }
    ]
  },

  bridal_profile: {
    name: "Bridal Designer Profile",
    description: "Customizable bridal designer/shop listing page",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Bridal Hero",
        content: {
          heading: "{vendor}",
          subheading: "Bridal Wear & Groom Collection"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "About Designer",
        content: {
          heading: "Our Design Philosophy",
          body: "Discover the vision and artistry behind our bridal collections."
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Bridal Collections",
        content: {
          heading: "Collections"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Brides in Our Gowns",
        content: {
          heading: "Real Brides"
        },
        order: 3
      },
      {
        sectionType: "testimonial",
        sectionName: "Client Reviews",
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Appointment & Services",
        content: {
          heading: "Book Your Bridal Appointment",
          body: "Personal styling sessions and expert alterations available."
        },
        order: 5
      },
      {
        sectionType: "faq",
        sectionName: "Bridal FAQs",
        order: 6
      },
      {
        sectionType: "cta_band",
        sectionName: "Appointment CTA",
        content: {
          heading: "Find Your Perfect Dress",
          subheading: "Schedule your private bridal appointment",
          ctaText: "Book Appointment"
        },
        order: 7
      }
    ]
  },

  rentals_profile: {
    name: "Rentals Profile",
    description: "Customizable event rentals listing page",
    sections: [
      {
        sectionType: "hero_image",
        sectionName: "Rentals Hero",
        content: {
          heading: "{vendor}",
          subheading: "Event Décor & Rentals"
        },
        order: 0
      },
      {
        sectionType: "rich_text",
        sectionName: "About Rentals",
        content: {
          heading: "Premium Event Rentals",
          body: "Transform your wedding with our curated collection of décor and furnishings."
        },
        order: 1
      },
      {
        sectionType: "featured_cards",
        sectionName: "Rental Categories",
        content: {
          heading: "What We Offer"
        },
        order: 2
      },
      {
        sectionType: "featured_cards",
        sectionName: "Portfolio",
        content: {
          heading: "Styled Events"
        },
        order: 3
      },
      {
        sectionType: "testimonial",
        sectionName: "Client Testimonials",
        order: 4
      },
      {
        sectionType: "rich_text",
        sectionName: "Services & Delivery",
        content: {
          heading: "Full-Service Rentals",
          body: "Professional setup, styling, and delivery included with every order."
        },
        order: 5
      },
      {
        sectionType: "faq",
        sectionName: "Rentals FAQs",
        order: 6
      },
      {
        sectionType: "cta_band",
        sectionName: "Quote CTA",
        content: {
          heading: "Create Your Dream Event",
          subheading: "Get a custom quote for your wedding",
          ctaText: "Request Quote"
        },
        order: 7
      }
    ]
  }
};

/**
 * Get template by page type
 */
export const getPageTemplate = (pageType) => {
  return PAGE_TEMPLATES[pageType] || PAGE_TEMPLATES.custom;
};

/**
 * Create sections from template
 * Substitutes placeholders like {destination} with actual values
 */
export const createSectionsFromTemplate = (pageType, pageData) => {
  const template = getPageTemplate(pageType);
  if (!template) return [];

  return template.sections.map((sectionConfig, index) => {
    const sectionTemplate = getSectionTemplate(sectionConfig.sectionType);
    if (!sectionTemplate) return null;

    let contentOverrides = sectionConfig.content || {};

    // Replace placeholders
    const replacePlaceholders = (text) => {
      if (!text) return text;
      return text
        .replace("{destination}", pageData.destinationName || "destination")
        .replace("{vendor}", pageData.vendorName || "venue");
    };

    // Apply placeholder replacement to content
    const processedContent = {};
    Object.entries(contentOverrides).forEach(([key, value]) => {
      processedContent[key] = replacePlaceholders(value);
    });

    return {
      ...sectionTemplate,
      id: `section_${Date.now()}_${index}`,
      position: sectionConfig.order,
      sectionName: sectionConfig.sectionName,
      content: {
        ...sectionTemplate.content,
        ...processedContent
      }
    };
  }).filter(Boolean);
};

export default {
  PAGE_TEMPLATES,
  getPageTemplate,
  createSectionsFromTemplate
};
