// ═══════════════════════════════════════════════════════════════════════════
// Category Grid Admin — manage images and display for CategoryGrid
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import ImageUploadField from "../../components/admin/ImageUploadField";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

export default function CategoryGridAdmin({ C }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    label: "",
    image: "",
    position: 0,
    active: true,
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, label, image, position, active")
          .order("position", { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Open edit form
  const handleEdit = (cat) => {
    setEditId(cat.id);
    setEditForm({
      label: cat.label,
      image: cat.image || "",
      position: cat.position,
      active: cat.active,
    });
  };

  // Save category
  const handleSave = async () => {
    if (!editForm.label.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          label: editForm.label.trim(),
          image: editForm.image,
          position: editForm.position,
          active: editForm.active,
        })
        .eq("id", editId);

      if (error) throw error;

      // Update local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editId
            ? {
                ...cat,
                label: editForm.label.trim(),
                image: editForm.image,
                position: editForm.position,
                active: editForm.active,
              }
            : cat
        )
      );

      setEditId(null);
    } catch (err) {
      console.error("Failed to save category:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: C.grey2 }}>
        Loading categories...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontFamily: GD,
            fontSize: 28,
            color: C.off,
            margin: "0 0 8px",
          }}
        >
          Category Grid
        </h2>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.grey2, margin: 0 }}>
          Manage images and settings for homepage category cards
        </p>
      </div>

      {/* Categories List */}
      <div style={{ display: "grid", gap: 20 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: 24,
            }}
          >
            {editId === cat.id ? (
              // Edit Form
              <div style={{ display: "grid", gap: 20 }}>
                <div>
                  <label
                    style={{
                      fontFamily: NU,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: C.gold,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Label
                  </label>
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, label: e.target.value }))
                    }
                    style={{
                      fontFamily: NU,
                      fontSize: 14,
                      color: C.off,
                      background: C.black,
                      border: `1px solid ${C.border}`,
                      padding: "10px 12px",
                      borderRadius: 4,
                      width: "100%",
                    }}
                  />
                </div>

                {/* Image Upload */}
                <ImageUploadField
                  label="Card Image"
                  value={editForm.image}
                  onChange={(url) =>
                    setEditForm((p) => ({ ...p, image: url }))
                  }
                  bucket="listing-media"
                  folder="categories/grid"
                  hint="Portrait image (recommend 500×700px)"
                  palette={C}
                  previewHeight={140}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label
                      style={{
                        fontFamily: NU,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.gold,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Position
                    </label>
                    <input
                      type="number"
                      value={editForm.position}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          position: parseInt(e.target.value) || 0,
                        }))
                      }
                      style={{
                        fontFamily: NU,
                        fontSize: 14,
                        color: C.off,
                        background: C.black,
                        border: `1px solid ${C.border}`,
                        padding: "10px 12px",
                        borderRadius: 4,
                        width: "100%",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontFamily: NU,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.gold,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      Active
                    </label>
                    <select
                      value={editForm.active ? "yes" : "no"}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          active: e.target.value === "yes",
                        }))
                      }
                      style={{
                        fontFamily: NU,
                        fontSize: 14,
                        color: C.off,
                        background: C.black,
                        border: `1px solid ${C.border}`,
                        padding: "10px 12px",
                        borderRadius: 4,
                        width: "100%",
                      }}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => setEditId(null)}
                    style={{
                      fontFamily: NU,
                      fontSize: 12,
                      padding: "10px 20px",
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      color: C.grey2,
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      fontFamily: NU,
                      fontSize: 12,
                      padding: "10px 20px",
                      background: C.gold,
                      color: C.black,
                      border: "none",
                      borderRadius: 4,
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr auto",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                {/* Image Preview */}
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.label}
                    style={{
                      width: 100,
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                )}

                {/* Details */}
                <div>
                  <h3
                    style={{
                      fontFamily: GD,
                      fontSize: 16,
                      color: C.off,
                      margin: "0 0 6px",
                    }}
                  >
                    {cat.label}
                  </h3>
                  <p
                    style={{
                      fontFamily: NU,
                      fontSize: 12,
                      color: C.grey2,
                      margin: "0 0 6px",
                    }}
                  >
                    Position: <strong>{cat.position}</strong>
                  </p>
                  <p
                    style={{
                      fontFamily: NU,
                      fontSize: 12,
                      color: cat.active ? C.gold : C.grey2,
                      margin: 0,
                    }}
                  >
                    {cat.active ? "✓ Active" : "○ Inactive"}
                  </p>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleEdit(cat)}
                  style={{
                    fontFamily: NU,
                    fontSize: 12,
                    padding: "10px 16px",
                    background: C.black,
                    border: `1px solid ${C.border}`,
                    color: C.gold,
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
