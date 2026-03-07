/**
 * Public Vendor Profile Page - Renders Page Studio pages publicly
 * Displays vendor profile with all sections created in the Page Studio CMS
 */

import { useState, useEffect } from "react";
import { loadPages } from "./PageStudio/utils/pageStorage.js";
import SiteFooter from "../components/sections/SiteFooter.jsx";
import InquiryModal from "../components/InquiryModal.jsx";

// Section component renderers
const SectionRenderers = {
  hero_image: ({ content, settings, colors, fonts }) => (
    <section
      style={{
        backgroundColor: settings?.backgroundColor || colors.dark,
        padding: `${settings?.paddingTop || 60}px 20px ${settings?.paddingBottom || 40}px 20px`,
        textAlign: settings?.textAlign || "center",
        backgroundImage: content?.image ? `url(${content.image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {content?.image && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 1,
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 2, color: "white" }}>
        {content?.heading && (
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: 48,
              fontWeight: 400,
              margin: "0 0 16px 0",
              color: "white",
            }}
          >
            {content.heading}
          </h1>
        )}
        {content?.subheading && (
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 20,
              margin: "0 0 24px 0",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {content.subheading}
          </p>
        )}
        {content?.body && (
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              margin: "0 0 32px 0",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {content.body}
          </p>
        )}
        {content?.ctaText && (
          <a
            href={content.ctaUrl || "#contact"}
            style={{
              display: "inline-block",
              padding: "14px 32px",
              backgroundColor: colors.gold,
              color: "white",
              textDecoration: "none",
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: "3px",
              textTransform: "uppercase",
            }}
          >
            {content.ctaText}
          </a>
        )}
      </div>
    </section>
  ),

  rich_text: ({ content, settings, colors, fonts }) => (
    <section
      style={{
        backgroundColor: settings?.backgroundColor || colors.card,
        padding: `${settings?.paddingTop || 40}px 20px ${settings?.paddingBottom || 40}px 20px`,
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {content?.heading && (
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: 36,
              fontWeight: 400,
              color: colors.white,
              margin: "0 0 24px 0",
            }}
          >
            {content.heading}
          </h2>
        )}
        {content?.body && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              lineHeight: 1.6,
              color: colors.grey,
              whiteSpace: "pre-wrap",
            }}
          >
            {content.body}
          </div>
        )}
      </div>
    </section>
  ),

  featured_cards: ({ content, settings, colors, fonts }) => (
    <section
      style={{
        backgroundColor: settings?.backgroundColor || colors.bg,
        padding: `${settings?.paddingTop || 40}px 20px ${settings?.paddingBottom || 40}px 20px`,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {content?.heading && (
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: 36,
              fontWeight: 400,
              color: colors.white,
              margin: "0 0 40px 0",
              textAlign: "center",
            }}
          >
            {content.heading}
          </h2>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`,
            gap: "24px",
          }}
        >
          {content?.cards?.map((card) => (
            <div
              key={card.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: "4px",
                overflow: "hidden",
                border: `1px solid ${colors.border}`,
              }}
            >
              {card.image && (
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    backgroundColor: colors.dark,
                    backgroundImage: `url(${card.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}
              <div style={{ padding: "20px" }}>
                {card.title && (
                  <h3
                    style={{
                      fontFamily: fonts.heading,
                      fontSize: 18,
                      fontWeight: 400,
                      color: colors.white,
                      margin: "0 0 12px 0",
                    }}
                  >
                    {card.title}
                  </h3>
                )}
                {card.description && (
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.grey,
                      margin: "0 0 16px 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {card.description}
                  </p>
                )}
                {card.ctaText && (
                  <a
                    href={card.ctaUrl || "#"}
                    style={{
                      display: "inline-block",
                      padding: "10px 16px",
                      backgroundColor: colors.gold,
                      color: "white",
                      textDecoration: "none",
                      fontFamily: fonts.body,
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: "3px",
                      textTransform: "uppercase",
                    }}
                  >
                    {card.ctaText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),

  cta_band: ({ content, settings, colors, fonts }) => (
    <section
      style={{
        backgroundColor: settings?.backgroundColor || colors.gold,
        padding: `${settings?.paddingTop || 40}px 20px ${settings?.paddingBottom || 40}px 20px`,
        textAlign: settings?.textAlign || "center",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {content?.heading && (
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: 32,
              fontWeight: 400,
              color: "white",
              margin: "0 0 16px 0",
            }}
          >
            {content.heading}
          </h2>
        )}
        {content?.body && (
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              color: "rgba(255,255,255,0.9)",
              margin: "0 0 24px 0",
            }}
          >
            {content.body}
          </p>
        )}
        {content?.ctaText && (
          <a
            href={content.ctaUrl || "#contact"}
            style={{
              display: "inline-block",
              padding: "14px 32px",
              backgroundColor: "white",
              color: colors.gold,
              textDecoration: "none",
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: "3px",
              textTransform: "uppercase",
            }}
          >
            {content.ctaText}
          </a>
        )}
      </div>
    </section>
  ),

  testimonial: ({ content, settings, colors, fonts }) => (
    <section
      style={{
        backgroundColor: settings?.backgroundColor || colors.card,
        padding: `${settings?.paddingTop || 40}px 20px ${settings?.paddingBottom || 40}px 20px`,
        textAlign: settings?.textAlign || "center",
      }}
    >
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {content?.quote && (
          <blockquote
            style={{
              fontFamily: fonts.heading,
              fontSize: 24,
              fontWeight: 400,
              color: colors.white,
              margin: "0 0 24px 0",
              fontStyle: "italic",
            }}
          >
            "{content.quote}"
          </blockquote>
        )}
        {content?.author && (
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 16,
              fontWeight: 600,
              color: colors.white,
              margin: "0 0 4px 0",
            }}
          >
            {content.author}
          </p>
        )}
        {content?.role && (
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.grey2,
              margin: 0,
            }}
          >
            {content.role}
          </p>
        )}
        {content?.rating && (
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.gold,
              margin: "12px 0 0 0",
            }}
          >
            {"★".repeat(content.rating)}
            {"☆".repeat(5 - content.rating)}
          </p>
        )}
      </div>
    </section>
  ),

  faq: ({ content, settings, colors, fonts }) => (
    <section
      style={{
        backgroundColor: settings?.backgroundColor || colors.bg,
        padding: `${settings?.paddingTop || 40}px 20px ${settings?.paddingBottom || 40}px 20px`,
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {content?.heading && (
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: 36,
              fontWeight: 400,
              color: colors.white,
              margin: "0 0 40px 0",
              textAlign: "center",
            }}
          >
            {content.heading}
          </h2>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {content?.faqs?.map((faq) => (
            <details
              key={faq.id}
              style={{
                backgroundColor: colors.card,
                padding: "20px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                cursor: "pointer",
              }}
            >
              <summary
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 16,
                  fontWeight: 500,
                  color: colors.white,
                  outline: "none",
                }}
              >
                {faq.question}
              </summary>
              <p
                style={{
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: colors.grey,
                  margin: "16px 0 0 0",
                  lineHeight: 1.6,
                }}
              >
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  ),

  spacer: ({ settings, colors }) => (
    <div
      style={{
        backgroundColor: colors.bg,
        height: `${settings?.height || 40}px`,
      }}
    />
  ),
};

// Main component
const PublicVendorProfilePage = ({ vendorSlug, onBack, footerNav = {} }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  // Color tokens
  const colors = {
    bg: "#fbf7f4",
    dark: "#ede5db",
    card: "#ffffff",
    border: "#ddd4c8",
    gold: "#8a6d1b",
    white: "#1a1a1a",
    grey: "#5a5147",
    grey2: "#8a8078",
    green: "#15803d",
  };

  const fonts = {
    body: "var(--font-body, 'Nunito', sans-serif)",
    heading: "var(--font-heading, 'Gilda Display', serif)",
  };

  // Load page from Page Studio
  useEffect(() => {
    const loadPageData = async () => {
      try {
        const pages = await loadPages([]);
        const foundPage = pages.find(
          (p) => p.slug === vendorSlug || p.id.includes(vendorSlug)
        );
        if (foundPage) {
          setPage(foundPage);
        }
      } catch (error) {
        console.error("Error loading page:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [vendorSlug]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          fontFamily: fonts.body,
          color: colors.grey,
        }}
      >
        Loading vendor profile...
      </div>
    );
  }

  if (!page) {
    return (
      <div
        style={{
          backgroundColor: colors.bg,
          minHeight: "100vh",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontFamily: fonts.heading, fontSize: 32, color: colors.white }}>
          Profile Not Found
        </h2>
        <p style={{ fontFamily: fonts.body, color: colors.grey }}>
          The vendor profile you're looking for doesn't exist.
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: "24px",
            padding: "12px 24px",
            backgroundColor: colors.gold,
            color: "white",
            fontFamily: fonts.body,
            fontSize: 14,
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          ← Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.dark,
          padding: "16px 20px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={onBack}
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.gold,
            background: "none",
            border: "none",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          ← Back
        </button>
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: 24,
            color: colors.white,
            margin: 0,
          }}
        >
          {page.title}
        </h1>
        <button
          onClick={() => setInquiryModalOpen(true)}
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            fontWeight: 600,
            padding: "10px 16px",
            backgroundColor: colors.gold,
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Inquire
        </button>
      </div>

      {/* Sections */}
      {page.sections && page.sections.length > 0 ? (
        page.sections.map((section) => {
          const Renderer =
            SectionRenderers[section.sectionType] ||
            SectionRenderers.rich_text;
          return (
            <div key={section.id}>
              {section.isVisible !== false && (
                <Renderer
                  content={section.content}
                  settings={section.settings}
                  colors={colors}
                  fonts={fonts}
                />
              )}
            </div>
          );
        })
      ) : (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: colors.grey,
          }}
        >
          <p style={{ fontFamily: fonts.body }}>
            This profile has no content yet.
          </p>
        </div>
      )}

      {/* Footer */}
      <SiteFooter {...footerNav} />

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={inquiryModalOpen}
        vendorName={page.title}
        vendorId={vendorSlug}
        onClose={() => setInquiryModalOpen(false)}
        onSuccess={() => {
          // Inquiry saved, modal closes after user confirmation
        }}
      />
    </div>
  );
};

export default PublicVendorProfilePage;
