/**
 * All Pages module - Master list of all pages
 */

import { useState, useEffect } from "react";
import PageStatusBadge from "./components/PageStatusBadge";
import { MOCK_PAGES } from "./data/mockPages";
import { savePages, loadPages, deletePage } from "./utils/pageStorage";

const AllPagesModule = ({ C, NU, GD, onNavigate }) => {
  const [pages, setPages] = useState([]);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    search: ""
  });

  // Load pages from localStorage on mount
  useEffect(() => {
    const loaded = loadPages(MOCK_PAGES);
    setPages(loaded);
  }, []);

  // Filter pages
  const filteredPages = pages.filter((page) => {
    const matchesType = filters.type === "all" || page.pageType === filters.type;
    const matchesStatus = filters.status === "all" || page.status === filters.status;
    const matchesSearch =
      !filters.search ||
      page.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      page.slug.toLowerCase().includes(filters.search.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const handleDeletePage = (pageId) => {
    if (confirm("Are you sure you want to delete this page?")) {
      const updated = deletePage(pages, pageId);
      setPages(updated);
    }
  };

  const handleEditPage = (pageId) => {
    onNavigate("page-editor", { pageId });
  };

  const handleCreatePage = () => {
    onNavigate("create-page");
  };

  const handleDuplicatePage = (page) => {
    const newPage = {
      ...page,
      id: `page_${Date.now()}`,
      title: `${page.title} (Copy)`,
      slug: `${page.slug}-copy`,
      status: "draft"
    };
    const updated = [...pages, newPage];
    savePages(updated);
    setPages(updated);
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

  const selectStyle = {
    fontFamily: NU,
    fontSize: 11,
    color: C.white,
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: "6px 12px",
    outline: "none",
    cursor: "pointer"
  };

  const inputStyle = {
    fontFamily: NU,
    fontSize: 11,
    color: C.white,
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: "6px 12px",
    outline: "none",
    width: 200
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      {/* Header */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontFamily: GD, fontSize: 28, color: C.white, margin: 0 }}>
            All Pages
          </h2>
          <button
            onClick={handleCreatePage}
            style={{
              fontFamily: NU,
              fontSize: 9,
              fontWeight: 700,
              color: "#000",
              background: C.gold,
              border: "none",
              borderRadius: 3,
              padding: "8px 16px",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.08em"
            }}
          >
            + Create Page
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={selectStyle}
            >
              <option value="all">All Types</option>
              <option value="homepage">Homepage</option>
              <option value="blog_landing">Blog Landing</option>
              <option value="custom">Custom</option>
              <option value="campaign">Campaign</option>
              <option value="destination">Destination</option>
              <option value="category">Category</option>
              <option value="editorial">Editorial</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={selectStyle}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Search</label>
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div
        style={{
          flex: 1,
          padding: "0 20px",
          overflow: "auto",
          borderTop: `1px solid ${C.border}`,
          paddingTop: 16
        }}
      >
        {filteredPages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: C.grey2,
              fontFamily: NU,
              fontSize: 12
            }}
          >
            No pages found
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 0.8fr 1fr 1fr 1fr 0.7fr 0.8fr",
                gap: 12,
                padding: "8px 12px",
                borderBottom: `2px solid ${C.border}`,
                marginBottom: 8,
                backgroundColor: C.black
              }}
            >
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Title
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Slug
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Type
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Status
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Template
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Updated
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Sections
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Author
              </div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, fontWeight: 600, textTransform: "uppercase" }}>
                Actions
              </div>
            </div>

            {/* Table Rows */}
            {filteredPages.map((page) => {
              const updatedDate = new Date(page.updatedAt);
              const formattedDate = updatedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              });

              return (
                <div
                  key={page.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 0.8fr 1fr 1fr 1fr 0.7fr 0.8fr",
                    gap: 12,
                    padding: "12px",
                    borderBottom: `1px solid ${C.border}`,
                    alignItems: "center",
                    backgroundColor: C.dark,
                    marginBottom: 4,
                    borderRadius: 3
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.card;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = C.dark;
                  }}
                >
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: 0, fontWeight: 500 }}>
                      {page.title}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0 }}>
                      {page.slug}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 10, color: C.white, margin: 0, textTransform: "capitalize" }}>
                      {page.pageType.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <PageStatusBadge status={page.status} C={C} />
                  </div>
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0 }}>
                      {page.templateKey}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0 }}>
                      {formattedDate}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 10, color: C.white, margin: 0, fontWeight: 500 }}>
                      {page.sections?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0 }}>
                      {page.author}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => handleEditPage(page.id)}
                      style={{
                        fontFamily: NU,
                        fontSize: 8,
                        padding: "4px 8px",
                        backgroundColor: C.gold,
                        color: "#000",
                        border: "none",
                        borderRadius: 2,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicatePage(page)}
                      style={{
                        fontFamily: NU,
                        fontSize: 8,
                        padding: "4px 8px",
                        backgroundColor: "transparent",
                        color: C.gold,
                        border: `1px solid ${C.gold}`,
                        borderRadius: 2,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Dup
                    </button>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      style={{
                        fontFamily: NU,
                        fontSize: 8,
                        padding: "4px 8px",
                        backgroundColor: C.rose,
                        color: "#fff",
                        border: "none",
                        borderRadius: 2,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "0 20px 16px 20px",
          borderTop: `1px solid ${C.border}`,
          fontFamily: NU,
          fontSize: 10,
          color: C.grey2
        }}
      >
        Showing {filteredPages.length} of {pages.length} pages
      </div>
    </div>
  );
};

export default AllPagesModule;
