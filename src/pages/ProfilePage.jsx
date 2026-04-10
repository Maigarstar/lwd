// src/pages/ProfilePage.jsx
import { useEffect, useMemo, useState } from "react";

import CatNav from "../components/nav/CatNav";
import SliderNav from "../components/ui/SliderNav";
import PlannerMapPanel from "../components/maps/PlannerMapPanel";

import { useTheme } from "../theme/ThemeContext";

import { useChat } from "../chat/ChatContext";

import { ListingSidebar } from "../components/listing-sidebar";
import VendorMobileBar from "../components/vendor/VendorMobileBar";
import VendorContactForm from "../components/vendor/VendorContactForm";

// If you already have a lightbox or media modal, use it here
import LightboxModal from "../components/media/LightboxModal";

// Helpers (reuse from your current profile pages if they already exist)
const money = (n) => {
  if (n == null) return "";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `£${n}`;
  }
};

const slugToLabel = (s) =>
  String(s || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const isVenue = (entityType) => entityType === "venue";

export default function ProfilePage({
  entityType, // "venue" | "planner" | "photographer" | etc
  entity, // resolved object, venue or vendor
  similarEntities = [],
  recentlyViewed = [],

  onBack,
  onViewEntity,
  countrySlug,
  regionSlug,
  onViewRegion,
  footerNav,
}) {
  const chat = useChat();

  const C = useTheme();
  const darkMode = C.darkMode;

  const enriched = useMemo(() => {
    if (!entity) return null;

    const trustBadges = Array.isArray(entity.trustBadges) ? [...entity.trustBadges] : [];
    if (!trustBadges.length) {
      if (entity.responseTime) trustBadges.push(`Responds ${String(entity.responseTime).toLowerCase()}`);
      if (entity.responseRate) trustBadges.push(`${entity.responseRate}% response rate`);
      if (entity.weddingsPlanned) trustBadges.push(`${entity.weddingsPlanned}+ weddings planned`);
    }

    return { ...entity, trustBadges };
  }, [entity]);

  useEffect(() => {
    if (!enriched) return;

    chat?.setChatContext?.({
      page: "profile",
      entityType,
      country: enriched.country || countrySlug,
      region: enriched.region || regionSlug,
      category: isVenue(entityType) ? "venues" : `${entityType}s`,
      entityId: enriched.id,
      entityName: enriched.name,
    });
  }, [chat, enriched, entityType, countrySlug, regionSlug]);

  const crumbs = useMemo(() => {
    const typeLabel = isVenue(entityType) ? "Venues" : slugToLabel(`${entityType}s`);
    return [
      { label: "Home", onClick: onBack },
      { label: slugToLabel(countrySlug), onClick: () => onViewRegion?.(countrySlug) },
      { label: slugToLabel(regionSlug), onClick: () => onViewRegion?.(countrySlug, regionSlug) },
      { label: typeLabel },
      { label: enriched?.name || "" },
    ].filter((c) => c.label);
  }, [entityType, countrySlug, regionSlug, onBack, onViewRegion, enriched]);

  // Lightbox state for gallery and real weddings
  const [lightbox, setLightbox] = useState({ open: false, items: [], index: 0 });

  if (!enriched) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 16px" }}>
          <h1 style={{ margin: 0 }}>Profile not found</h1>
          <p style={{ marginTop: 12, opacity: 0.75 }}>Try going back and selecting another profile.</p>
        </div>
      </div>
    );
  }

  return (
      <div style={{ background: "#fff", minHeight: "100vh" }}>
        <CatNav crumbs={crumbs} />

        <HeroSection entityType={entityType} entity={enriched} C={C} onBack={onBack} />

        {/* This is the venue style stats bar, only show for venues */}
        {isVenue(entityType) ? <StatsBar entity={enriched} C={C} /> : null}

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "clamp(28px, 4vw, 44px) clamp(16px, 4vw, 40px) 120px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: 56,
              alignItems: "start",
            }}
            className="lwd-stack900"
          >
            {/* Left rail */}
            <div style={{ minWidth: 0 }}>
              {/* Editorial first */}
              <EditorialSection entityType={entityType} entity={enriched} />

              {/* You asked for a 750 wide featured photo between editorial and gallery */}
              <FeaturedImage750 entity={enriched} />

              {/* Gallery and video in the same location as venues */}
              <MediaGallerySection
                entity={enriched}
                onOpen={(items, index) => setLightbox({ open: true, items, index })}
              />

              {/* Reviews, match venue styling */}
              <ReviewsSection entity={enriched} C={C} />

              {/* FAQ accordion, match venue styling */}
              <FAQSection entity={enriched} />

              {/* Coverage and map if data exists */}
              <CoverageSection entityType={entityType} entity={enriched} />

              {/* Related, same style as venue page */}
              <RelatedSection
                title="You Might Also Love"
                subtitle="Curated by Aura based on your browsing"
                items={similarEntities}
                onViewEntity={onViewEntity}
              />

              {/* Recently viewed, same style as venue page */}
              <RelatedSection
                title="Recently Viewed"
                subtitle="Based on your browsing history"
                items={recentlyViewed}
                onViewEntity={onViewEntity}
              />

              {/* Still have a question CTA strip, same as venues */}
              <BottomQuestionCta entity={enriched} />
            </div>

            {/* Right rail sticky sidebar, modular ListingSidebar */}
            <div
              className="vpt-sidebar"
              style={{
                position: "sticky",
                top: 56,
                alignSelf: "start",
              }}
            >
              <ListingSidebar
                entity={enriched}
                entityType={entityType}
                C={C}
                onEnquire={() => {
                  // TODO (future phase): open enquiry modal / scroll to full form
                  // For now, scroll to mobile form or bottom CTA
                  const anchor = document.querySelector(".lwd-enquiry-anchor");
                  if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            </div>
          </div>
        </div>

        <VendorMobileBar vendor={enriched} C={C} />

        {lightbox.open ? (
          <LightboxModal
            items={lightbox.items}
            index={lightbox.index}
            onClose={() => setLightbox({ open: false, items: [], index: 0 })}
            onPrev={() =>
              setLightbox((s) => ({ ...s, index: Math.max(0, s.index - 1) }))
            }
            onNext={() =>
              setLightbox((s) => ({ ...s, index: Math.min(s.items.length - 1, s.index + 1) }))
            }
          />
        ) : null}
      </div>
  );
}

/* Sections below, keep them local like VenueProfile does, easy to clone styling */

function HeroSection({ entityType, entity, C, onBack }) {
  const hero = entity.heroImage || entity.image || entity.images?.[0];

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          height: "clamp(320px, 48vw, 520px)",
          background: hero
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${hero}) center / cover no-repeat`
            : "linear-gradient(#111, #222)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(18px, 3vw, 36px) clamp(16px, 4vw, 40px)" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, padding: "10px 12px" }}>
            Back
          </button>

          <div style={{ marginTop: "clamp(18px, 3vw, 36px)", color: "#fff" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.95 }}>
              <Badge text={isVenue(entityType) ? "VENUE" : slugToLabel(entityType)} />
              {entity.verified ? <Badge text="VERIFIED" /> : null}
              {entity.online ? <Badge text="ONLINE" /> : null}
            </div>

            <h1 style={{ margin: "14px 0 10px", fontSize: "clamp(34px, 5.2vw, 74px)", lineHeight: 1.02 }}>
              {entity.name}
            </h1>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", opacity: 0.9 }}>
              <span>{entity.location || entity.region || ""}</span>
              {entity.rating ? <span>{entity.rating} ({entity.reviewCount || 0} reviews)</span> : null}
              {entity.responseTime ? <span>Responds {String(entity.responseTime).toLowerCase()}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsBar({ entity }) {
  // Match venue stats bar styling and structure
  const cells = [
    { top: money(entity.fromPrice), mid: "FROM", bot: "per event" },
    { top: entity.ceremonyCapacity ? `Up to ${entity.ceremonyCapacity}` : "", mid: "CEREMONY", bot: "guests" },
    { top: entity.diningCapacity ? `Up to ${entity.diningCapacity}` : "", mid: "DINNER", bot: "guests" },
    { top: entity.sleeps ? `${entity.sleeps}` : "", mid: "SLEEPS", bot: entity.rooms ? `${entity.rooms} rooms` : "" },
    { top: entity.responseTime ? String(entity.responseTime).replace("Under ", "") : "", mid: "RESPONDS", bot: entity.responseRate ? `${entity.responseRate}% response rate` : "" },
    { top: entity.rating ? `${entity.rating} ★` : "", mid: "RATING", bot: entity.reviewCount ? `${entity.reviewCount} reviews` : "" },
  ].filter((c) => c.top);

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px, 4vw, 40px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(6, cells.length)}, 1fr)` }}>
          {cells.slice(0, 6).map((c, i) => (
            <div key={i} style={{ padding: "18px 16px", borderLeft: i === 0 ? "none" : "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 28, letterSpacing: -0.2 }}>{c.top}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{c.mid}</div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>{c.bot}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorialSection({ entity }) {
  return (
    <section style={{ padding: "22px 0 10px" }}>
      <div style={{ maxWidth: 760 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.55 }}>EDITORIAL</div>
        <h2 style={{ margin: "12px 0 10px", fontSize: 28 }}>The feeling they create</h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, opacity: 0.85 }}>
          {entity.editorial || entity.desc || ""}
        </p>
      </div>
    </section>
  );
}

function FeaturedImage750({ entity }) {
  const img = entity.featuredImage || entity.images?.[0];
  if (!img) return null;

  return (
    <section style={{ padding: "22px 0 8px" }}>
      <div style={{ width: "min(750px, 100%)" }}>
        <img
          src={img}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 14 }}
        />
      </div>
    </section>
  );
}

function MediaGallerySection({ entity, onOpen }) {
  const videoUrl = entity.videoUrl || "";
  const images = Array.isArray(entity.images) ? entity.images : [];
  const items = [
    ...(videoUrl ? [{ type: "video", src: videoUrl, thumb: images[0] }] : []),
    ...images.map((src) => ({ type: "image", src })),
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <section style={{ padding: "18px 0 16px" }}>
      <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.55, marginBottom: 10 }}>GALLERY</div>

      {/* This is where you swap in the exact venue gallery component, if you have one */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {items.slice(0, 4).map((it, idx) => (
          <button
            key={`${it.type}-${idx}`}
            onClick={() => onOpen(items, idx)}
            style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
          >
            <div
              style={{
                height: 260,
                borderRadius: 14,
                overflow: "hidden",
                background: it.thumb
                  ? `url(${it.thumb}) center / cover no-repeat`
                  : `url(${it.src}) center / cover no-repeat`,
                position: "relative",
              }}
            >
              {it.type === "video" ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.25))",
                  }}
                >
                  <div style={{ width: 58, height: 58, borderRadius: 999, background: "rgba(255,255,255,0.88)", display: "grid", placeItems: "center" }}>
                    ▶
                  </div>
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ReviewsSection({ entity }) {
  // Replace this with your exact venue reviews component, this is a placeholder
  if (!Array.isArray(entity.testimonials) || !entity.testimonials.length) return null;

  return (
    <section style={{ padding: "22px 0" }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 34 }}>Reviews</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }} className="lwd-stack900">
        {entity.testimonials.slice(0, 3).map((t, i) => (
          <div key={i} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontStyle: "italic", lineHeight: 1.65, opacity: 0.9 }}>{t.quote}</div>
            <div style={{ marginTop: 14, opacity: 0.7, fontSize: 14 }}>
              {t.couple} · {t.date}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQSection({ entity }) {
  if (!Array.isArray(entity.faqs) || !entity.faqs.length) return null;

  return (
    <section style={{ padding: "10px 0 22px" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 34 }}>Your Guide</h2>
      <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden" }}>
        {entity.faqs.map((f, i) => (
          <details key={i} style={{ padding: 16, borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.06)" }}>
            <summary style={{ cursor: "pointer", fontSize: 16 }}>{f.q}</summary>
            <div style={{ marginTop: 10, opacity: 0.8, lineHeight: 1.65 }}>{f.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function CoverageSection({ entityType, entity }) {
  const showMap = entityType !== "venue" && (entity.coverage?.length || entity.base);
  if (!showMap) return null;

  return (
    <section style={{ padding: "18px 0 22px" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 34 }}>Coverage</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="lwd-stack900">
        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 18 }}>
          <div style={{ opacity: 0.7, fontSize: 14 }}>Regions served</div>
          <div style={{ marginTop: 10, fontSize: 16 }}>
            {(entity.coverage || []).join(", ")}
          </div>
          {entity.base ? <div style={{ marginTop: 12, opacity: 0.7 }}>Base: {entity.base}</div> : null}
        </div>

        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden" }}>
          <PlannerMapPanel vendor={entity} />
        </div>
      </div>
    </section>
  );
}

function RelatedSection({ title, subtitle, items, onViewEntity }) {
  if (!Array.isArray(items) || !items.length) return null;

  return (
    <section style={{ padding: "20px 0" }}>
      <h2 style={{ margin: 0, fontSize: 44 }}>{title}</h2>
      {subtitle ? <div style={{ marginTop: 8, opacity: 0.65 }}>{subtitle}</div> : null}

      <div style={{ marginTop: 16 }}>
        <SliderNav
          items={items.slice(0, 12)}
          renderItem={(it) => (
            <button
              onClick={() => onViewEntity?.(it)}
              style={{
                width: 360,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 16,
                overflow: "hidden",
                padding: 0,
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ height: 220, background: `url(${it.image || it.heroImage}) center / cover no-repeat` }} />
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 22 }}>{it.name}</div>
                <div style={{ marginTop: 6, opacity: 0.7, fontSize: 14 }}>{it.location || it.region || ""}</div>
                <div style={{ marginTop: 10, opacity: 0.8, fontSize: 14 }}>
                  {it.rating ? `${it.rating} ★` : ""} {it.fromPrice ? ` · From ${money(it.fromPrice)}` : ""}
                </div>
              </div>
            </button>
          )}
        />
      </div>
    </section>
  );
}

function BottomQuestionCta() {
  return (
    <section style={{ padding: "22px 0 0" }}>
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          background: "rgba(0,0,0,0.02)",
          borderRadius: 16,
          padding: "22px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 28 }}>Still have a question?</div>
          <div style={{ marginTop: 6, opacity: 0.75 }}>We reply fast, we would love to help.</div>
        </div>
        <button
          style={{
            padding: "14px 18px",
            borderRadius: 14,
            border: "none",
            background: "#9a8442",
            color: "#fff",
            fontSize: 14,
            letterSpacing: 1.2,
            cursor: "pointer",
          }}
        >
          ASK A QUESTION →
        </button>
      </div>
    </section>
  );
}

function Badge({ text }) {
  return (
    <span
      style={{
        border: "1px solid rgba(255,255,255,0.35)",
        background: "rgba(0,0,0,0.18)",
        borderRadius: 999,
        padding: "7px 10px",
        fontSize: 12,
        letterSpacing: 1.6,
      }}
    >
      {text}
    </span>
  );
}