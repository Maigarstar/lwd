// ─── src/pages/PlannerProfilePage.jsx ─────────────────────────────────────────
// Refactored: Now uses ProfileTemplateBase with MediaBlock integration
// Matches VendorProfileTemplate structure but with modern architecture
// ──────────────────────────────────────────────────────────────────────────────
import { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import ProfileTemplateBase from "../components/profile/ProfileTemplateBase";
import { useIsMobile } from "../components/profile/ProfileDesignSystem";
import CatNav from "../components/nav/CatNav";
import VendorSidebar from "../components/vendor/VendorSidebar";
import VendorMobileBar from "../components/vendor/VendorMobileBar";
import { getLightPalette } from "../theme/tokens";
import { setListingContext, clearListingContext } from "../lib/tracker";

const DEFAULT_STEPS = [
  { title: "Discovery", description: "A calm, focused call to define the feeling, the guest journey, and the priorities." },
  { title: "Design", description: "Creative direction, vendor curation, and a plan that keeps everything aligned." },
  { title: "Execution", description: "On the day, they run point, protect the couple, and keep the room effortless." },
];

const FALLBACK_HERO = "https://images.unsplash.com/photo-1523438097201-512ae7d59c2a?auto=format&fit=crop&w=2000&q=80";

export default function PlannerProfilePage({
  plannerId = null,
  plannerSlug = null,
  getPlannerByIdOrSlug = null,
  onBack = () => {},
  onOpenChat = () => {},
  onSave = () => {},
  isSaved = false,
  similarPlanners = [],
  onViewPlanner = () => {},
  footerNav = {},
  countrySlug = null,
  regionSlug = null,
  onViewRegion = null,
  onViewRegionCategory = null,
}) {
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const C = getLightPalette();

  // Fetch and enrich planner data with defaults for ProfileTemplateBase
  const planner = useMemo(() => {
    if (!getPlannerByIdOrSlug) return null;
    const p = getPlannerByIdOrSlug(plannerId || plannerSlug);
    if (!p) return null;

    // Build videos array from individual video properties if needed
    let videos = p.videos || [];
    if (videos.length === 0 && (p.videoUrl || p.youtubeId || p.vimeoId)) {
      videos = [{
        id: "planner-video-1",
        thumb: p.videoThumb || p.imgs?.[0] || FALLBACK_HERO,
        url: p.videoUrl || null,
        youtubeId: p.youtubeId || null,
        vimeoId: p.vimeoId || null,
        title: p.videoTitle || "Planning Highlight",
        duration: p.videoDuration || null,
        desc: p.videoDesc || "A showcase of our planning approach",
        videographer: p.videoPhotographer || { name: "Professional", area: p.city || p.region || "Italy" },
      }];
    }

    // Build gallery array from imgs if gallery is empty
    let gallery = p.gallery || [];
    if (gallery.length === 0 && p.imgs && Array.isArray(p.imgs)) {
      gallery = p.imgs.map((img, idx) => ({
        id: `img-${idx}`,
        src: img,
        alt: `Planner gallery image ${idx + 1}`,
        tags: [],
        photographer: { name: p.name || "Wedding Planner", area: p.city || p.region || "Italy" },
      }));
    }

    return {
      ...p,
      // Apply planner-specific defaults
      name: p.name || "Wedding Planner",
      location: p.location || p.city || p.region || "Italy",
      flag: p.flag || "🇮🇹",
      rating: p.rating || 4.8,
      reviews: p.reviews || 24,
      responseTime: p.responseTime || "2 hrs",
      responseRate: p.responseRate || 95,
      verified: p.verified !== false,
      featured: p.featured || false,

      // Required fields
      priceFrom: p.priceFrom || "£2,500",
      weddingsPlanned: p.weddingsPlanned || 50,

      // Media - use enriched arrays
      imgs: p.imgs || [FALLBACK_HERO],
      heroImg: p.heroImg || FALLBACK_HERO,
      gallery,
      videos,

      // Content
      editorial: p.editorial || p.desc || "Expert wedding planning services",
      approachSteps: p.approachSteps || DEFAULT_STEPS,
      languages: p.languages || ["English", "Italian"],
      planningStyle: p.planningStyle || "Modern, classic",
      travelPolicy: p.travelPolicy || "By arrangement",
      coverage: p.coverage || [p.region || "England"].filter(Boolean),

      // Reviews & testimonials
      testimonials: p.testimonials || [],

      // FAQ & featured image
      faqData: p.faqData || [],
      featuredImage: p.featuredImage || null,

      // Awards & press
      awards: p.awards || [],
      press: p.press || [],

      // Contact
      contact: p.contact || {
        name: p.contactName || "Event Coordinator",
        phone: p.phone || "+44 (0) 20 7946 0000",
        email: p.email || "enquire@example.com",
      },
    };
  }, [getPlannerByIdOrSlug, plannerId, plannerSlug]);

  // Tag all tracker events with this listing while on the page
  useEffect(() => {
    if (!planner) return;
    setListingContext(planner.id || null, plannerSlug || planner.slug || null, 'planner');
    return () => clearListingContext();
  }, [planner, plannerSlug]);

  if (!planner) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Planner not found</div>;
  }

  // SEO metadata
  const canonicalUrl = useMemo(() => {
    if (!planner) return undefined;
    const slug = planner.slug || planner.id;
    let url = "https://luxuryweddingdirectory.com";
    if (countrySlug && regionSlug) {
      url += `/${countrySlug}/${regionSlug}/wedding-planners/${slug}`;
    } else if (countrySlug) {
      url += `/${countrySlug}/wedding-planners/${slug}`;
    } else {
      url += `/wedding-planners/${slug}`;
    }
    return url;
  }, [planner, countrySlug, regionSlug]);

  const pageTitle = planner
    ? `${planner.name} – Wedding Planner${planner.region ? ` in ${planner.region}` : ""}`
    : "Wedding Planner";

  const metaDescription = planner
    ? planner.desc || `Discover ${planner.name}, a luxury wedding planner${planner.region ? ` in ${planner.region}` : ""}. Highly rated and personally verified by LWD.`
    : "Luxury wedding planner verified by Luxury Wedding Directory";

  const ogImage = planner && planner.imgs && planner.imgs[0]
    ? planner.imgs[0]
    : "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&h=630&q=80";

  // ── Breadcrumb schema ───────────────────────────────────────────────────────
  const breadcrumbItems = useMemo(() => {
    const items = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://luxuryweddingdirectory.com/"
      }
    ];
    let position = 2;

    // Add country (if present)
    if (countrySlug) {
      items.push({
        "@type": "ListItem",
        "position": position,
        "name": countrySlug.charAt(0).toUpperCase() + countrySlug.slice(1),
        "item": `https://luxuryweddingdirectory.com/${countrySlug}`
      });
      position++;
    }

    // Add region (if present)
    if (regionSlug && countrySlug && regionSlug !== countrySlug) {
      const regionName = regionSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      items.push({
        "@type": "ListItem",
        "position": position,
        "name": regionName,
        "item": `https://luxuryweddingdirectory.com/${countrySlug}/${regionSlug}`
      });
      position++;
    }

    // Add category (wedding-planners)
    items.push({
      "@type": "ListItem",
      "position": position,
      "name": "Wedding Planners",
      "item": canonicalUrl
        ? canonicalUrl.split("/").slice(0, -1).join("/")
        : "https://luxuryweddingdirectory.com/wedding-planners"
    });
    position++;

    // Add current planner (current page)
    if (planner && planner.name) {
      items.push({
        "@type": "ListItem",
        "position": position,
        "name": planner.name,
        "item": canonicalUrl || "https://luxuryweddingdirectory.com/wedding-planners"
      });
    }

    return items;
  }, [countrySlug, regionSlug, planner, canonicalUrl]);

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Luxury Wedding Directory</title>
        <meta name="description" content={metaDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={ogImage} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta property="og:type" content="website" />
        {planner && (
          <>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={ogImage} />
          </>
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbItems
          })}
        </script>
      </Helmet>
      <ProfileTemplateBase
        entity={planner}
        entityType="planner"
        hideAtAGlance={true}
        onEnquire={onOpenChat}
        header={
          <CatNav
            onBack={onBack}
            scrolled={scrolled}
            darkMode={false}
            onToggleDark={() => {}}
          />
        }
        sidebar={
          <VendorSidebar
            vendor={planner}
            vendorType="planner"
            C={C}
            onChat={onOpenChat}
            onSave={onSave}
            isSaved={isSaved}
          />
        }
        mobileBar={
          <VendorMobileBar vendor={planner} C={C} />
        }
      />
    </>
  );
}
