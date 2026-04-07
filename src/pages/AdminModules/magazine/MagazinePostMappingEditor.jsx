// MagazinePostMappingEditor.jsx
// Post to Section Mapping — assign posts to multiple sections with flexible relationships
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SANS = "'Inter', 'Helvetica Neue', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  const G = "#c9a84c";
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "error" ? "#2a1010" : "#0e1a0e",
      border: `1px solid ${type === "error" ? "#f87171" : G}`,
      borderLeft: `3px solid ${type === "error" ? "#f87171" : G}`,
      color: type === "error" ? "#f87171" : "#4ade80",
      padding: "12px 20px", borderRadius: 8,
      fontFamily: SANS, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>{msg}</div>
  );
}

// ── Post Mapping Editor ────────────────────────────────────────────────────
export default function MagazinePostMappingEditor({ C }) {
  const G = C?.gold || "#c9a84c";

  // ── State ─────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [sections, setSections] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Load data ──────────────────────────────────────────────────────────
  async function loadData() {
    try {
      const [postsRes, sectionsRes, mappingsRes] = await Promise.all([
        supabase
          .from("magazine_posts")
          .select("id, title, slug, excerpt, category")
          .order("created_at", { ascending: false }),
        supabase
          .from("mag_sections")
          .select("id, title, mag_nav_item_id")
          .order("position", { ascending: true }),
        supabase
          .from("mag_post_sections")
          .select("*"),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;
      if (mappingsRes.error) throw mappingsRes.error;

      setPosts(postsRes.data || []);
      setSections(sectionsRes.data || []);
      setMappings(mappingsRes.data || []);
    } catch (err) {
      setToast({ msg: "Load failed: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // ── Get mappings for selected post ─────────────────────────────────────
  const postMappings = selectedPostId
    ? mappings.filter(m => m.post_id === selectedPostId)
    : [];

  // ── Add post to section ────────────────────────────────────────────────
  async function addMapping(sectionId, isPrimary = false) {
    try {
      const { error } = await supabase
        .from("mag_post_sections")
        .insert([{
          post_id: selectedPostId,
          section_id: sectionId,
          is_primary: isPrimary,
          position: 0,
        }]);
      if (error) throw error;
      await loadData();
      setToast({ msg: "Added to section", type: "success" });
    } catch (err) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
    }
  }

  // ── Remove mapping ─────────────────────────────────────────────────────
  async function removeMapping(mappingId) {
    try {
      const { error } = await supabase
        .from("mag_post_sections")
        .delete()
        .eq("id", mappingId);
      if (error) throw error;
      await loadData();
      setToast({ msg: "Removed from section", type: "success" });
    } catch (err) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
    }
  }

  // ── Toggle primary ─────────────────────────────────────────────────────
  async function togglePrimary(mappingId, isPrimary) {
    try {
      const { error } = await supabase
        .from("mag_post_sections")
        .update({ is_primary: !isPrimary })
        .eq("id", mappingId);
      if (error) throw error;
      await loadData();
      setToast({ msg: isPrimary ? "Secondary" : "Primary", type: "success" });
    } catch (err) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
    }
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <p style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", marginBottom: 20, lineHeight: 1.6 }}>
        Assign posts to multiple sections. Posts can belong to different sections with primary/secondary relationships for flexible storytelling.
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C?.grey || "#8a7d6a" }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left: Posts list */}
          <div>
            <h4 style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              ARTICLES
            </h4>
            <div style={{
              border: `1px solid ${C?.border || "#2a2218"}`,
              borderRadius: 8, maxHeight: "60vh", overflowY: "auto",
            }}>
              {posts.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: C?.grey || "#8a7d6a", fontFamily: SANS, fontSize: 12 }}>
                  No articles found
                </div>
              ) : (
                posts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    style={{
                      width: "100%", padding: 12, textAlign: "left",
                      border: "none", borderBottom: `1px solid ${C?.border || "#2a2218"}`,
                      background: selectedPostId === post.id ? `${G}20` : "transparent",
                      cursor: "pointer", transition: "all 0.15s",
                      fontFamily: SANS,
                    }}
                  >
                    <div style={{
                      fontWeight: selectedPostId === post.id ? 700 : 400,
                      color: selectedPostId === post.id ? G : (C?.white || "#f5efe4"),
                      fontSize: 13, marginBottom: 4,
                    }}>
                      {post.title}
                    </div>
                    <div style={{
                      fontSize: 11, color: C?.grey || "#8a7d6a",
                    }}>
                      {post.category || "uncategorized"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Section assignments */}
          <div>
            {selectedPostId ? (
              <>
                <h4 style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  ASSIGN TO SECTIONS
                </h4>

                {/* Current assignments */}
                {postMappings.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Currently In
                    </div>
                    <div style={{ display: "grid", gap: 6, marginBottom: 20 }}>
                      {postMappings.map(mapping => {
                        const section = sections.find(s => s.id === mapping.section_id);
                        return (
                          <div
                            key={mapping.id}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: 12, background: C?.card || "#1a1510",
                              border: `1px solid ${mapping.is_primary ? G : (C?.border || "#2a2218")}`,
                              borderRadius: 6,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: SANS, fontSize: 13, color: C?.white || "#f5efe4", marginBottom: 2 }}>
                                {section?.title}
                              </div>
                              <div style={{
                                fontFamily: SANS, fontSize: 10, color: mapping.is_primary ? G : (C?.grey || "#8a7d6a"),
                                fontWeight: mapping.is_primary ? 700 : 400,
                              }}>
                                {mapping.is_primary ? "PRIMARY" : "Secondary"}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              <button
                                onClick={() => togglePrimary(mapping.id, mapping.is_primary)}
                                style={{
                                  background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
                                  borderRadius: 4, padding: "4px 8px", fontFamily: SANS, fontSize: 9,
                                  color: C?.grey || "#8a7d6a", cursor: "pointer", transition: "all 0.2s",
                                  fontWeight: 600, letterSpacing: "0.06em",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = C?.border || "#2a2218"; e.currentTarget.style.color = C?.grey || "#8a7d6a"; }}
                              >
                                {mapping.is_primary ? "2nd" : "Primary"}
                              </button>
                              <button
                                onClick={() => removeMapping(mapping.id)}
                                style={{
                                  background: "#f87171", border: "none", borderRadius: 4,
                                  padding: "4px 8px", fontFamily: SANS, fontSize: 9,
                                  color: "#fff", cursor: "pointer", fontWeight: 700,
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available sections to add */}
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Available Sections
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {sections.filter(s => !postMappings.find(m => m.section_id === s.id)).map(section => (
                      <button
                        key={section.id}
                        onClick={() => addMapping(section.id)}
                        style={{
                          padding: 12, textAlign: "left", border: `1px solid ${C?.border || "#2a2218"}`,
                          background: C?.card || "#1a1510", borderRadius: 6, cursor: "pointer",
                          transition: "all 0.15s", fontFamily: SANS,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = `${G}15`;
                          e.currentTarget.style.borderColor = G;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = C?.card || "#1a1510";
                          e.currentTarget.style.borderColor = C?.border || "#2a2218";
                        }}
                      >
                        <div style={{
                          fontSize: 13, color: C?.white || "#f5efe4", marginBottom: 4,
                        }}>
                          {section.title}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.5 }}>
                          + Add as secondary
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                padding: 24, textAlign: "center", color: C?.grey || "#8a7d6a",
                fontFamily: SANS, fontSize: 13,
              }}>
                Select an article on the left to assign it to sections
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
