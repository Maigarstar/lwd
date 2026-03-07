/**
 * SEO configuration panel for pages
 */

import { useState } from "react";

const SEOPanel = ({ page, onUpdate, C, NU, GD }) => {
  const [seoData, setSeoData] = useState(page.seo || {});

  const handleSeoChange = (field, value) => {
    const updated = { ...seoData, [field]: value };
    setSeoData(updated);
    onUpdate({ ...page, seo: updated });
  };

  // Calculate SEO completeness score (0-7)
  const calculateScore = () => {
    let score = 0;
    if (seoData.title && seoData.title.length > 10) score++;
    if (seoData.metaDescription && seoData.metaDescription.length > 20) score++;
    if (seoData.canonicalUrl) score++;
    if (seoData.ogTitle) score++;
    if (seoData.ogDescription) score++;
    if (seoData.ogImage) score++;
    if (seoData.structuredDataType) score++;
    return score;
  };

  const score = calculateScore();
  const scoreColor = score >= 6 ? C.green : score >= 4 ? C.gold : C.grey2;

  const labelStyle = {
    fontFamily: NU,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.grey2,
    fontWeight: 600,
    marginBottom: 5,
    display: "block"
  };

  const inputStyle = {
    fontFamily: NU,
    fontSize: 12,
    color: C.white,
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: "7px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 16
  };

  const textareaStyle = { ...inputStyle, minHeight: 80, resize: "vertical" };

  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: GD, fontSize: 14, color: C.white }}>SEO Settings</span>
        <span style={{ fontSize: 12, color: scoreColor, fontWeight: 600 }}>
          Score: {score}/7
        </span>
      </div>

      {/* SEO Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          SEO Title {seoData.title && `(${seoData.title.length}/60)`}
        </label>
        <input
          type="text"
          maxLength="60"
          value={seoData.title || ""}
          onChange={(e) => handleSeoChange("title", e.target.value)}
          placeholder="Page title for search results"
          style={inputStyle}
        />
      </div>

      {/* Meta Description */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Meta Description {seoData.metaDescription && `(${seoData.metaDescription.length}/160)`}
        </label>
        <textarea
          maxLength="160"
          value={seoData.metaDescription || ""}
          onChange={(e) => handleSeoChange("metaDescription", e.target.value)}
          placeholder="Description shown in search results"
          style={textareaStyle}
        />
      </div>

      {/* Slug */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Slug</label>
        <input
          type="text"
          value={page.slug || ""}
          disabled
          style={{ ...inputStyle, backgroundColor: C.dark, cursor: "not-allowed" }}
        />
      </div>

      {/* Canonical URL */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Canonical URL</label>
        <input
          type="text"
          value={seoData.canonicalUrl || ""}
          onChange={(e) => handleSeoChange("canonicalUrl", e.target.value)}
          placeholder="https://example.com/page"
          style={inputStyle}
        />
      </div>

      {/* Open Graph */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        <h4 style={{ fontFamily: NU, fontSize: 11, color: C.grey2, textTransform: "uppercase", marginBottom: 12 }}>
          Open Graph
        </h4>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>OG Title</label>
          <input
            type="text"
            value={seoData.ogTitle || ""}
            onChange={(e) => handleSeoChange("ogTitle", e.target.value)}
            placeholder="Title for social media sharing"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>OG Description</label>
          <textarea
            value={seoData.ogDescription || ""}
            onChange={(e) => handleSeoChange("ogDescription", e.target.value)}
            placeholder="Description for social media sharing"
            style={textareaStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>OG Image URL</label>
          <input
            type="text"
            value={seoData.ogImage || ""}
            onChange={(e) => handleSeoChange("ogImage", e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Indexing */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!seoData.noindex}
            onChange={(e) => handleSeoChange("noindex", !e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <span style={{ fontFamily: NU, fontSize: 12, color: C.white }}>
            Allow indexing by search engines
          </span>
        </label>
      </div>

      {/* Structured Data Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Structured Data Type</label>
        <select
          value={seoData.structuredDataType || "WebPage"}
          onChange={(e) => handleSeoChange("structuredDataType", e.target.value)}
          style={inputStyle}
        >
          <option value="WebPage">Web Page</option>
          <option value="Article">Article</option>
          <option value="BlogPosting">Blog Post</option>
          <option value="Event">Event</option>
          <option value="LocalBusiness">Local Business</option>
        </select>
      </div>
    </div>
  );
};

export default SEOPanel;
