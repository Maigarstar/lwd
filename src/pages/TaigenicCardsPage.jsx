import { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import TaigenicCard from "../components/cards/TaigenicCard";
import GCard from "../components/cards/GCard";
import GCardMobile from "../components/cards/GCardMobile";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import PlannerCard from "../components/cards/PlannerCard";
import HCard from "../components/cards/HCard";
import VenueListItemCard from "../components/cards/VenueListItemCard";
import HomeNav from "../components/nav/HomeNav";

export default function TaigenicCardsPage() {
  const C = useTheme();
  const [variant, setVariant] = useState("grid");
  const [plannerVariant, setPlannerVariant] = useState("grid");

  // Mock venue data
  const mockVenue = {
    id: "taigenic-demo",
    name: "Al Habtoor Palace Budapest",
    city: "Budapest",
    region: "Hungary",
    desc: "A palatial retreat in the heart of Budapest, AL Habtoor Palace invites couples to celebrate with opulence, glamour, and unrivaled exclusivity.",
    priceFrom: "from €50,000",
    rating: 4.9,
    reviews: 28,
    capacity: 250,
    imgs: [
      "https://images.unsplash.com/photo-1519671482677-504be0271101?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1519996529931-28991ba7a65c?w=1200&h=800&fit=crop",
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4",
    featured: true,
    verified: true,
    online: true,
    contentScore: 95,
    editorialApproved: true,
    editorialLastReviewedAt: "2026-03-15T00:00:00Z",
  };

  const mockVenue2 = {
    ...mockVenue,
    id: "taigenic-demo-2",
    name: "Lake Como Villa",
    city: "Lake Como",
    region: "Italy",
    desc: "Stunning lakeside villa with panoramic views of the Alpine mountains and crystal-clear waters. Perfect for intimate ceremonies and grand celebrations.",
    rating: 4.8,
    reviews: 42,
    capacity: 180,
    imgs: [
      "https://images.unsplash.com/photo-1522869635100-ce306e08cabb?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1519995549141-b5ed4a6266ee?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=800&fit=crop",
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4",
    contentScore: 92,
  };

  const mockVenue3 = {
    ...mockVenue,
    id: "taigenic-demo-3",
    name: "Tuscan Countryside Estate",
    city: "Tuscany",
    region: "Italy",
    desc: "Rolling vineyards, golden sunsets, and Renaissance architecture create an unforgettable backdrop for your wedding day.",
    rating: 4.7,
    reviews: 35,
    capacity: 200,
    imgs: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1506184712202-298e0e00c3da?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1519915212116-7cfef71f9e3e?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1520763185298-1b434c919eba?w=1200&h=800&fit=crop",
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4",
    contentScore: 89,
  };

  // Mock planner data
  const mockPlanner1 = {
    id: "planner-1",
    name: "Sofia Rossi Events",
    city: "Florence",
    region: "Tuscany",
    desc: "Award-winning wedding planner specializing in Italian destination weddings. Full planning, styling, and vendor coordination.",
    verified: true,
    featured: true,
    rating: 4.9,
    reviews: 47,
    serviceType: "Full Planning",
    priceFrom: "from €15,000",
    imgs: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506184712202-298e0e00c3da?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519915212116-7cfef71f9e3e?auto=format&fit=crop&w=900&q=80",
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4",
    instagram: "sofiarossievents",
    tiktok: "sofiarossievents",
    website: "https://sofiarossievents.com",
    specialties: ["Luxury Weddings", "Elopements", "Cultural Ceremonies"],
  };

  const mockPlanner2 = {
    id: "planner-2",
    name: "Marco Benedetti Planning",
    city: "Venice",
    region: "Veneto",
    desc: "Specialists in waterfront ceremonies and intimate lakeside celebrations. We handle every detail with precision.",
    verified: true,
    rating: 4.8,
    reviews: 32,
    serviceType: "Partial Planning",
    priceFrom: "from €8,000",
    imgs: [
      "https://images.unsplash.com/photo-1522869635100-ce306e08cabb?w=1200&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&h=600&fit=crop",
    ],
    instagram: "marcobenedetti_weddings",
    pinterest: "marcobenedetti",
    website: "https://marcobenedetti.it",
    specialties: ["Waterfront Ceremonies", "Cultural Events"],
  };

  const mockPlanner3 = {
    id: "planner-3",
    name: "Giulia & Partners",
    city: "Rome",
    region: "Lazio",
    desc: "Full-service luxury wedding planning with expertise in both traditional Roman celebrations and modern destination events.",
    verified: true,
    featured: true,
    rating: 4.7,
    reviews: 54,
    serviceType: "Full Planning",
    priceFrom: "from €20,000",
    imgs: [
      "https://images.unsplash.com/photo-1519995549141-b5ed4a6266ee?w=1200&h=600&fit=crop",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=600&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520763185298-1b434c919eba?w=1200&h=600&fit=crop",
    ],
    instagram: "giuliapartners_weddings",
    tiktok: "giuliapartnersweddings",
    website: "https://giuliapartners.com",
    specialties: ["Luxury Planning", "Vatican Ceremonies", "Destination Weddings"],
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 699 }}>
        <HomeNav hasHero={false} />
      </div>

      <div style={{ paddingTop: 61, padding: "61px 32px 32px" }}>
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: 42,
            fontWeight: 600,
            color: C.white,
            marginBottom: 32,
          }}
        >
          Card System Showcase
        </h1>

        {/* View Options (Grid/List) - TaigenicCard only */}
        <div style={{ marginBottom: 48, display: "flex", gap: 12 }}>
          <button
            onClick={() => setVariant("grid")}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 16px",
              borderRadius: 6,
              background: variant === "grid" ? "#C9A84C" : "rgba(201,168,76,0.2)",
              color: variant === "grid" ? "#0f0d0a" : C.grey,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Grid (360×560)
          </button>
          <button
            onClick={() => setVariant("list")}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 16px",
              borderRadius: 6,
              background: variant === "list" ? "#C9A84C" : "rgba(201,168,76,0.2)",
              color: variant === "list" ? "#0f0d0a" : C.grey,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            List (400×400)
          </button>
        </div>

        {/* TaigenicCard Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            TaigenicCard 2.0
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                variant === "list"
                  ? "repeat(auto-fill, minmax(400px, 1fr))"
                  : "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 24,
            }}
          >
            <TaigenicCard
              v={mockVenue}
              variant={variant}
              onView={(v) => console.log("View:", v.name)}
              onQuickView={(v) => console.log("QV:", v.name)}
              onSave={(id) => console.log("Save:", id)}
              saved={false}
            />
            <TaigenicCard
              v={mockVenue2}
              variant={variant}
              onView={(v) => console.log("View:", v.name)}
              onQuickView={(v) => console.log("QV:", v.name)}
              onSave={(id) => console.log("Save:", id)}
              saved={true}
            />
            <TaigenicCard
              v={mockVenue3}
              variant={variant}
              onView={(v) => console.log("View:", v.name)}
              onQuickView={(v) => console.log("QV:", v.name)}
              onSave={(id) => console.log("Save:", id)}
              saved={false}
            />
          </div>
        </div>

        {/* GCard Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            GCard
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 24,
            }}
          >
            <GCard
              v={mockVenue}
              saved={false}
              onSave={(id) => console.log("Save:", id)}
              onView={(v) => console.log("View:", v.name)}
              onQuickView={(v) => console.log("QV:", v.name)}
            />
            <GCard
              v={mockVenue2}
              saved={true}
              onSave={(id) => console.log("Save:", id)}
              onView={(v) => console.log("View:", v.name)}
              onQuickView={(v) => console.log("QV:", v.name)}
            />
            <GCard
              v={mockVenue3}
              saved={false}
              onSave={(id) => console.log("Save:", id)}
              onView={(v) => console.log("View:", v.name)}
              onQuickView={(v) => console.log("QV:", v.name)}
            />
          </div>
        </div>

        {/* LuxuryVenueCard Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            LuxuryVenueCard
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 24,
            }}
          >
            <LuxuryVenueCard
              v={mockVenue}
              onView={(v) => console.log("View:", v.name)}
              isMobile={false}
              quickViewItem={null}
              setQuickViewItem={() => {}}
            />
            <LuxuryVenueCard
              v={mockVenue2}
              onView={(v) => console.log("View:", v.name)}
              isMobile={false}
              quickViewItem={null}
              setQuickViewItem={() => {}}
            />
            <LuxuryVenueCard
              v={mockVenue3}
              onView={(v) => console.log("View:", v.name)}
              isMobile={false}
              quickViewItem={null}
              setQuickViewItem={() => {}}
            />
          </div>
        </div>

        {/* PlannerCard Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            PlannerCard
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 24,
            }}
          >
            <PlannerCard v={mockVenue} onView={(v) => console.log("View:", v.name)} />
            <PlannerCard v={mockVenue2} onView={(v) => console.log("View:", v.name)} />
            <PlannerCard v={mockVenue3} onView={(v) => console.log("View:", v.name)} />
          </div>
        </div>

        {/* HCard Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            HCard
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 24,
            }}
          >
            <HCard v={mockVenue} onView={(v) => console.log("View:", v.name)} />
            <HCard v={mockVenue2} onView={(v) => console.log("View:", v.name)} />
            <HCard v={mockVenue3} onView={(v) => console.log("View:", v.name)} />
          </div>
        </div>

        {/* PlannerCard List Mode Section */}
        <div style={{ marginBottom: 64, maxWidth: 1200, margin: "0 auto 64px" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            PlannerCard – List Mode (from WeddingPlannersPage)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <PlannerCard
              v={mockPlanner1}
              mode="list"
              onView={(v) => console.log("View:", v.name)}
            />
            <PlannerCard
              v={mockPlanner2}
              mode="list"
              onView={(v) => console.log("View:", v.name)}
            />
            <PlannerCard
              v={mockPlanner3}
              mode="list"
              onView={(v) => console.log("View:", v.name)}
            />
          </div>
        </div>

        {/* GCardMobile Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            GCardMobile
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            <GCardMobile
              v={mockVenue}
              saved={false}
              onSave={(id) => console.log("Save:", id)}
              onView={(v) => console.log("View:", v.name)}
            />
            <GCardMobile
              v={mockVenue2}
              saved={true}
              onSave={(id) => console.log("Save:", id)}
              onView={(v) => console.log("View:", v.name)}
            />
            <GCardMobile
              v={mockVenue3}
              saved={false}
              onSave={(id) => console.log("Save:", id)}
              onView={(v) => console.log("View:", v.name)}
            />
          </div>
        </div>

        {/* PlannerCard Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            PlannerCard
          </h2>
          <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
            <button
              onClick={() => setPlannerVariant("grid")}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 16px",
                borderRadius: 6,
                background: plannerVariant === "grid" ? "#C9A84C" : "rgba(201,168,76,0.2)",
                color: plannerVariant === "grid" ? "#0f0d0a" : C.grey,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setPlannerVariant("list")}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 16px",
                borderRadius: 6,
                background: plannerVariant === "list" ? "#C9A84C" : "rgba(201,168,76,0.2)",
                color: plannerVariant === "list" ? "#0f0d0a" : C.grey,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              List
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            <PlannerCard v={mockVenue} onView={(v) => console.log("View:", v.name)} mode={plannerVariant} />
            <PlannerCard v={mockVenue2} onView={(v) => console.log("View:", v.name)} mode={plannerVariant} />
            <PlannerCard v={mockVenue3} onView={(v) => console.log("View:", v.name)} mode={plannerVariant} />
          </div>
        </div>

        {/* VenueListItemCard Section */}
        <div style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 28,
              fontWeight: 600,
              color: C.white,
              marginBottom: 24,
            }}
          >
            VenueListItemCard
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <VenueListItemCard
              v={mockVenue}
              onView={(v) => console.log("View:", v.name)}
              isHighlighted={false}
            />
            <VenueListItemCard
              v={mockVenue2}
              onView={(v) => console.log("View:", v.name)}
              isHighlighted={false}
            />
            <VenueListItemCard
              v={mockVenue3}
              onView={(v) => console.log("View:", v.name)}
              isHighlighted={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
