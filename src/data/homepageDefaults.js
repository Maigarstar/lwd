// ═══════════════════════════════════════════════════════════════════════════════
// Homepage Defaults - Used when no content exists in Supabase
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_HOMEPAGE_CONTENT = {
  // ── Hero Section
  hero_title: "The World's Finest",
  hero_subtitle: "Wedding Directory",
  hero_cta_text: "Ask Aura",
  hero_cta_link: "#aura",
  hero_image_url: null, // Uses SlimHero carousel default

  // ── Destination Strip
  destination_heading: "Explore Iconic Destinations",
  destination_subtitle:
    "Curated wedding destinations across Europe and beyond",
  destination_ids: ["italy", "france", "spain", "portugal", "greece"],

  // ── Featured Venues
  venues_heading: "The World's Most Beautiful Wedding Venues",
  venues_subtitle:
    "From coastal escapes to castle retreats, explore iconic venues that define elegance, romance, and grandeur by destination.",
  venues_ids: [1, 2, 3], // Default featured venue IDs

  // ── Signature Section
  signature_heading: "LWD Signature Collection",
  signature_subtitle: "Our most prestigious and exclusive venues",
  signature_venue_ids: [1, 2], // Top-tier venue IDs

  // ── Vendor Section
  vendor_heading: "Trusted Wedding Professionals",
  vendor_subtitle: "Expert vendors curated for luxury weddings",
  vendor_ids: [1, 2, 3], // Default vendor IDs

  // ── Newsletter Block
  newsletter_heading: "Stay Updated",
  newsletter_subtitle:
    "Get the latest venue discoveries and wedding inspiration delivered to your inbox.",
  newsletter_button_text: "Subscribe",
};
