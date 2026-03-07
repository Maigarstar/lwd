/**
 * Blog Manager module - Configure blog landing page and post template
 */

import { useState, useEffect } from "react";
import { saveBlogConfig, loadBlogConfig } from "./utils/pageStorage";

const DEFAULT_BLOG_CONFIG = {
  index: {
    heroTitle: "Wedding Inspiration & Tips",
    heroSubtitle: "Latest trends and expert advice",
    featuredArticleEnabled: true,
    categoriesStripEnabled: true,
    latestPostsLayout: "3", // 2, 3, 4
    trendingPostsEnabled: true,
    editorPicksEnabled: true,
    newsletterCtaEnabled: true,
    seoTitle: "Wedding Blog | Luxury Wedding Directory",
    metaDescription: "Read the latest wedding trends and inspiration"
  },
  postTemplate: {
    heroStyle: "image", // image, video, none
    titlePosition: "top", // top, overlay, sidebar
    authorDisplay: true,
    readingTimeDisplay: true,
    relatedPostsEnabled: true,
    relatedPostsCount: 3,
    affiliateBlockPosition: "sidebar", // top, sidebar, hidden
    shareBlockEnabled: true,
    stickyCTAEnabled: true,
    schemaType: "BlogPosting"
  }
};

const BlogManagerModule = ({ C, NU, GD }) => {
  const [activeTab, setActiveTab] = useState("index");
  const [config, setConfig] = useState(DEFAULT_BLOG_CONFIG);

  useEffect(() => {
    const loaded = loadBlogConfig(DEFAULT_BLOG_CONFIG);
    setConfig(loaded);
  }, []);

  const handleSave = (updates, section) => {
    const updated = {
      ...config,
      [section]: {
        ...config[section],
        ...updates
      }
    };
    setConfig(updated);
    saveBlogConfig(updated);
  };

  const labelStyle = {
    fontFamily: NU,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.grey2,
    fontWeight: 600,
    marginBottom: 8,
    display: "block"
  };

  const inputStyle = {
    fontFamily: NU,
    fontSize: 12,
    color: C.white,
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: "8px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    padding: "12px 16px",
    fontFamily: NU,
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    backgroundColor: isActive ? C.card : "transparent",
    border: "none",
    borderBottom: isActive ? `3px solid ${C.gold}` : "none",
    color: isActive ? C.white : C.grey2,
    cursor: "pointer"
  });

  const toggleCheckboxStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    cursor: "pointer"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.dark
        }}
      >
        <h2 style={{ fontFamily: GD, fontSize: 28, color: C.white, margin: "0 0 8px 0" }}>
          Blog Manager
        </h2>
        <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, margin: 0 }}>
          Configure blog landing page and post template settings
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.dark,
          paddingLeft: 20
        }}
      >
        <button
          onClick={() => setActiveTab("index")}
          style={tabStyle(activeTab === "index")}
        >
          Blog Index
        </button>
        <button
          onClick={() => setActiveTab("postTemplate")}
          style={tabStyle(activeTab === "postTemplate")}
        >
          Post Template
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {activeTab === "index" && (
          <div>
            <h3 style={{ fontFamily: NU, fontSize: 12, color: C.white, marginBottom: 16, textTransform: "uppercase" }}>
              Blog Landing Page Settings
            </h3>

            {/* Hero Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Hero Title</label>
              <input
                type="text"
                value={config.index.heroTitle}
                onChange={(e) => handleSave({ heroTitle: e.target.value }, "index")}
                style={inputStyle}
              />
            </div>

            {/* Hero Subtitle */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Hero Subtitle</label>
              <input
                type="text"
                value={config.index.heroSubtitle}
                onChange={(e) => handleSave({ heroSubtitle: e.target.value }, "index")}
                style={inputStyle}
              />
            </div>

            {/* Featured Article */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.index.featuredArticleEnabled}
                onChange={(e) => handleSave({ featuredArticleEnabled: e.target.checked }, "index")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show featured article section
              </label>
            </div>

            {/* Categories Strip */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.index.categoriesStripEnabled}
                onChange={(e) => handleSave({ categoriesStripEnabled: e.target.checked }, "index")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show categories strip
              </label>
            </div>

            {/* Latest Posts Layout */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Latest Posts Grid Columns</label>
              <select
                value={config.index.latestPostsLayout}
                onChange={(e) => handleSave({ latestPostsLayout: e.target.value }, "index")}
                style={inputStyle}
              >
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
                <option value="4">4 Columns</option>
              </select>
            </div>

            {/* Trending Posts */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.index.trendingPostsEnabled}
                onChange={(e) => handleSave({ trendingPostsEnabled: e.target.checked }, "index")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show trending posts section
              </label>
            </div>

            {/* Editor Picks */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.index.editorPicksEnabled}
                onChange={(e) => handleSave({ editorPicksEnabled: e.target.checked }, "index")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show editor picks section
              </label>
            </div>

            {/* Newsletter CTA */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.index.newsletterCtaEnabled}
                onChange={(e) => handleSave({ newsletterCtaEnabled: e.target.checked }, "index")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show newsletter CTA block
              </label>
            </div>

            {/* SEO Title */}
            <div style={{ marginBottom: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <label style={labelStyle}>SEO Title</label>
              <input
                type="text"
                value={config.index.seoTitle}
                onChange={(e) => handleSave({ seoTitle: e.target.value }, "index")}
                style={inputStyle}
              />
            </div>

            {/* SEO Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>SEO Description</label>
              <input
                type="text"
                value={config.index.metaDescription}
                onChange={(e) => handleSave({ metaDescription: e.target.value }, "index")}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {activeTab === "postTemplate" && (
          <div>
            <h3 style={{ fontFamily: NU, fontSize: 12, color: C.white, marginBottom: 16, textTransform: "uppercase" }}>
              Blog Post Template
            </h3>

            {/* Hero Style */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Hero Style</label>
              <select
                value={config.postTemplate.heroStyle}
                onChange={(e) => handleSave({ heroStyle: e.target.value }, "postTemplate")}
                style={inputStyle}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Title Position */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Title Position</label>
              <select
                value={config.postTemplate.titlePosition}
                onChange={(e) => handleSave({ titlePosition: e.target.value }, "postTemplate")}
                style={inputStyle}
              >
                <option value="top">Top</option>
                <option value="overlay">Overlay</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>

            {/* Author Display */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.postTemplate.authorDisplay}
                onChange={(e) => handleSave({ authorDisplay: e.target.checked }, "postTemplate")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show author byline
              </label>
            </div>

            {/* Reading Time */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.postTemplate.readingTimeDisplay}
                onChange={(e) => handleSave({ readingTimeDisplay: e.target.checked }, "postTemplate")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show reading time estimate
              </label>
            </div>

            {/* Related Posts */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.postTemplate.relatedPostsEnabled}
                onChange={(e) => handleSave({ relatedPostsEnabled: e.target.checked }, "postTemplate")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show related posts section
              </label>
            </div>

            {/* Related Posts Count */}
            {config.postTemplate.relatedPostsEnabled && (
              <div style={{ marginBottom: 16, marginLeft: 28 }}>
                <label style={labelStyle}>Related Posts Count</label>
                <select
                  value={config.postTemplate.relatedPostsCount}
                  onChange={(e) => handleSave({ relatedPostsCount: parseInt(e.target.value) }, "postTemplate")}
                  style={inputStyle}
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            )}

            {/* Affiliate Block */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Affiliate Block Position</label>
              <select
                value={config.postTemplate.affiliateBlockPosition}
                onChange={(e) => handleSave({ affiliateBlockPosition: e.target.value }, "postTemplate")}
                style={inputStyle}
              >
                <option value="top">Top</option>
                <option value="sidebar">Sidebar</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {/* Share Block */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.postTemplate.shareBlockEnabled}
                onChange={(e) => handleSave({ shareBlockEnabled: e.target.checked }, "postTemplate")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show social share block
              </label>
            </div>

            {/* Sticky CTA */}
            <div style={toggleCheckboxStyle}>
              <input
                type="checkbox"
                checked={config.postTemplate.stickyCTAEnabled}
                onChange={(e) => handleSave({ stickyCTAEnabled: e.target.checked }, "postTemplate")}
                style={{ cursor: "pointer" }}
              />
              <label style={{ fontFamily: NU, fontSize: 11, color: C.white, cursor: "pointer" }}>
                Show sticky CTA block
              </label>
            </div>

            {/* Schema Type */}
            <div style={{ marginBottom: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <label style={labelStyle}>Structured Data Type</label>
              <select
                value={config.postTemplate.schemaType}
                onChange={(e) => handleSave({ schemaType: e.target.value }, "postTemplate")}
                style={inputStyle}
              >
                <option value="BlogPosting">Blog Post</option>
                <option value="Article">Article</option>
                <option value="NewsArticle">News Article</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagerModule;
