/**
 * Create Page module - Guided flow to create a new page
 */

import { useState } from "react";
import { PAGE_TYPES, PAGE_TEMPLATES } from "./data/pageTypes";
import { generateSlug, makeSlugUnique } from "./utils/slugUtils";
import { savePages, loadPages } from "./utils/pageStorage";
import { MOCK_PAGES } from "./data/mockPages";
import { createSectionsFromTemplate } from "./data/pageTemplates";

const CreatePageModule = ({ C, NU, GD, onNavigate, onPageCreated }) => {
  const [step, setStep] = useState(1); // 1, 2, 3, 4
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    status: "draft",
    excerpt: "",
    featuredImage: "",
    isLocked: false
  });

  const pages = loadPages(MOCK_PAGES);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setStep(2);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setStep(3);
  };

  const handleTitleChange = (title) => {
    const slug = makeSlugUnique(generateSlug(title), pages);
    setFormData({
      ...formData,
      title,
      slug
    });
  };

  const handleCreatePage = () => {
    if (!formData.title.trim()) {
      alert("Please enter a page title");
      return;
    }

    // Auto-populate sections from template
    // Replace placeholders based on page type
    const isVendorProfile = [
      "venue_profile",
      "planner_profile",
      "photographer_profile",
      "florist_profile",
      "videographer_profile",
      "bridal_profile",
      "rentals_profile",
      "vendor_profile"
    ].includes(selectedType);

    const templateData = {
      destinationName: selectedType === "destination" ? formData.title : "",
      vendorName:
        selectedType === "vendor_highlight" || isVendorProfile
          ? formData.title
          : ""
    };

    const templateSections = createSectionsFromTemplate(selectedType, templateData);

    const newPage = {
      id: `page_${Date.now()}`,
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      pageType: selectedType,
      templateKey: selectedTemplate,
      status: formData.status,
      excerpt: formData.excerpt,
      featuredImage: formData.featuredImage,
      heroVideoUrl: null,
      seo: {
        title: "",
        metaDescription: "",
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        noindex: false,
        structuredDataType: "WebPage"
      },
      sections: templateSections,
      author: "Admin",
      isLocked: formData.isLocked,
      updatedAt: new Date().toISOString(),
      publishedAt: formData.status === "published" ? new Date().toISOString() : null,
      scheduledAt: null
    };

    const updated = [...pages, newPage];
    savePages(updated);

    // Navigate to editor
    onNavigate("page-editor", { pageId: newPage.id });
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

  const cardStyle = (isSelected) => ({
    padding: "16px",
    borderRadius: 4,
    border: isSelected ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
    backgroundColor: isSelected ? C.card : C.dark,
    cursor: "pointer",
    transition: "all 0.2s"
  });

  const btnStyle = (isActive) => ({
    fontFamily: NU,
    fontSize: 9,
    fontWeight: 700,
    color: isActive ? "#000" : C.gold,
    background: isActive ? C.gold : "transparent",
    border: `1px solid ${C.gold}`,
    borderRadius: 3,
    padding: "8px 16px",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: GD, fontSize: 28, color: C.white, margin: "0 0 8px 0" }}>
          Create New Page
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                width: 24,
                height: 24,
                borderRadius: 3,
                backgroundColor: s <= step ? C.gold : C.dark,
                color: s <= step ? "#000" : C.grey2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: NU,
                fontSize: 10,
                fontWeight: 600
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", marginBottom: 20 }}>
        {/* Step 1: Page Type Selection */}
        {step === 1 && (
          <div>
            <h3 style={{ fontFamily: NU, fontSize: 12, color: C.white, marginBottom: 16, textTransform: "uppercase" }}>
              Choose Page Type
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {Object.values(PAGE_TYPES).map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  style={cardStyle(selectedType === type.id)}
                  onMouseEnter={(e) => {
                    if (selectedType !== type.id) {
                      e.currentTarget.style.borderColor = C.gold;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedType !== type.id) {
                      e.currentTarget.style.borderColor = C.border;
                    }
                  }}
                >
                  <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: "0 0 4px 0", fontWeight: 600 }}>
                    {type.label}
                  </p>
                  <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0 }}>
                    {type.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Template Selection */}
        {step === 2 && (
          <div>
            <h3 style={{ fontFamily: NU, fontSize: 12, color: C.white, marginBottom: 16, textTransform: "uppercase" }}>
              Choose Template
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {Object.values(PAGE_TEMPLATES).map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  style={cardStyle(selectedTemplate === template.id)}
                  onMouseEnter={(e) => {
                    if (selectedTemplate !== template.id) {
                      e.currentTarget.style.borderColor = C.gold;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate !== template.id) {
                      e.currentTarget.style.borderColor = C.border;
                    }
                  }}
                >
                  <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: "0 0 4px 0", fontWeight: 600 }}>
                    {template.label}
                  </p>
                  <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0 }}>
                    {template.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Page Details */}
        {step === 3 && (
          <div>
            <h3 style={{ fontFamily: NU, fontSize: 12, color: C.white, marginBottom: 16, textTransform: "uppercase" }}>
              Page Details
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Page Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Luxury Wedding Venues in Lake Como"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Auto-generated from title"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Page Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={inputStyle}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Excerpt (Optional)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the page"
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Page Lock</label>
              <div
                onClick={() => setFormData({ ...formData, isLocked: !formData.isLocked })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: `1px solid ${formData.isLocked ? C.gold + "55" : C.border}`,
                  borderRadius: 3,
                  backgroundColor: formData.isLocked ? C.gold + "0d" : C.dark,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{formData.isLocked ? "🔒" : "🔓"}</span>
                <div>
                  <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: formData.isLocked ? C.gold : C.white, display: "block" }}>
                    {formData.isLocked ? "Locked" : "Unlocked"}
                  </span>
                  <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, display: "block", marginTop: 1 }}>
                    {formData.isLocked
                      ? "Slug and delete are protected. Unlock in the editor to make changes."
                      : "Click to lock this page after creation."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {step === 4 && (
          <div>
            <h3 style={{ fontFamily: NU, fontSize: 12, color: C.white, marginBottom: 16, textTransform: "uppercase" }}>
              Review & Create
            </h3>

            <div
              style={{
                padding: 16,
                backgroundColor: C.dark,
                borderRadius: 4,
                borderLeft: `4px solid ${C.gold}`
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 4px 0" }}>TITLE</p>
                <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0, fontWeight: 600 }}>
                  {formData.title}
                </p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 4px 0" }}>SLUG</p>
                <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: 0 }}>
                  {formData.slug}
                </p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 4px 0" }}>TYPE</p>
                <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: 0, textTransform: "capitalize" }}>
                  {PAGE_TYPES[selectedType]?.label}
                </p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 4px 0" }}>TEMPLATE</p>
                <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: 0 }}>
                  {PAGE_TEMPLATES[selectedTemplate]?.label}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: NU, fontSize: 9, color: C.grey2, margin: "0 0 4px 0" }}>LOCK</p>
                <p style={{ fontFamily: NU, fontSize: 12, color: formData.isLocked ? C.gold : C.grey2, margin: 0 }}>
                  {formData.isLocked ? "🔒 Locked after creation" : "🔓 Unlocked"}
                </p>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, backgroundColor: C.black, borderRadius: 4 }}>
              <p style={{ fontFamily: NU, fontSize: 11, color: C.gold, margin: 0 }}>
                ✓ Page will be created as a <strong>draft</strong>. You can edit sections and publish it when ready.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        <button
          onClick={() => (step === 1 ? onNavigate("all-pages") : setStep(step - 1))}
          style={{
            fontFamily: NU,
            fontSize: 9,
            fontWeight: 700,
            color: C.gold,
            background: "transparent",
            border: `1px solid ${C.gold}`,
            borderRadius: 3,
            padding: "8px 16px",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.08em"
          }}
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>

        <button
          onClick={() => {
            if (step === 4) {
              handleCreatePage();
            } else if (step < 4) {
              setStep(step + 1);
            }
          }}
          disabled={
            (step === 1 && !selectedType) ||
            (step === 2 && !selectedTemplate) ||
            (step === 3 && !formData.title.trim())
          }
          style={{
            fontFamily: NU,
            fontSize: 9,
            fontWeight: 700,
            color: step === 4 ? "#000" : C.gold,
            background: step === 4 ? C.gold : "transparent",
            border: `1px solid ${C.gold}`,
            borderRadius: 3,
            padding: "8px 16px",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            opacity:
              (step === 1 && !selectedType) ||
              (step === 2 && !selectedTemplate) ||
              (step === 3 && !formData.title.trim())
                ? 0.5
                : 1
          }}
        >
          {step === 4 ? "Create Page" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default CreatePageModule;
