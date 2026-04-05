// ─── src/chat/WorkspaceRight.jsx ──────────────────────────────────────────────
import { useState } from "react";
import { useChat }         from "./ChatContext";
import RecommendationCard  from "./RecommendationCard";
import ArticlePreview      from "../components/chat/ArticlePreview";
import QuickViewModal      from "../components/modals/QuickViewModal";
import Icon                from "./Icons";

const GOLD = "#C9A84C";

// ── Theme helper ───────────────────────────────────────────────────────────────
function getT(dark) {
  if (dark) return {
    bg:      "#0D0B09",
    text:    "#FFFFFF",
    grey:    "rgba(255,255,255,0.42)",
    divider: "rgba(201,168,76,0.16)",
    emptyBg: "none",
  };
  return {
    bg:      "#f3efeb",
    text:    "#1A1714",
    grey:    "rgba(26,23,20,0.45)",
    divider: "rgba(26,23,20,0.1)",
    emptyBg: "none",
  };
}

// ── Collapsed state ────────────────────────────────────────────────────────────
function CollapsedRight({ itemCount, darkMode }) {
  const T = getT(darkMode);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 20, height: "100%" }}>
      <Icon name="sparkleMini" size={16} color={GOLD} style={{ opacity: 0.75 }} />
      {itemCount > 0 && (
        <div style={{
          background: GOLD, color: "#0D0B09",
          width: 26, height: 26, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, fontFamily: "var(--font-body)",
        }}>
          {itemCount > 9 ? "9+" : itemCount}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorkspaceRight({ collapsed, darkMode }) {
  const { recommendations, articleRecommendations = [], articlesLoading = false } = useChat();
  const { items = [], summary = "Curated for you" } = recommendations ?? {};
  const [qvItem, setQvItem] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const T = getT(darkMode);

  // Combine venue/vendor items with article previews
  const allItems = [
    ...items,
    ...articleRecommendations.map((article) => ({
      ...article,
      type: "article",
    })),
  ];

  if (collapsed) {
    return <CollapsedRight itemCount={items.length} darkMode={darkMode} />;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg, boxSizing: "border-box", transition: "background 0.3s ease" }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: "18px 18px 13px", borderBottom: `1px solid ${T.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 17, fontWeight: 500, color: T.text }}>
            Curated for you
          </div>
          {allItems.length > 0 && (
            <span style={{
              background: "rgba(201,168,76,0.12)",
              border:    `1px solid rgba(201,168,76,0.28)`,
              color:      GOLD,
              fontSize:   10,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              padding:    "2px 8px",
              borderRadius: 12,
            }}>
              {allItems.length} result{allItems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: T.grey, opacity: 0.7, marginTop: 4 }}>
          {summary}
        </div>
      </div>

      {/* ── Scrollable cards ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>
        {allItems.length === 0 && !articlesLoading ? (
          <div style={{ textAlign: "center", padding: "56px 12px", fontFamily: "var(--font-body)", fontSize: 13, color: T.grey, opacity: 0.5, lineHeight: 1.65 }}>
            <div style={{ marginBottom: 12, opacity: 0.4 }}><Icon name="sparkle" size={28} color={GOLD} /></div>
            Ask Aura about venues, regions, vendors, or editorial topics to see curated recommendations here.
          </div>
        ) : (
          <>
            {/* Venue/Vendor recommendations */}
            {items.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                darkMode={darkMode}
                onQuickView={setQvItem}
                onViewFull={setQvItem}
              />
            ))}

            {/* Article recommendations divider */}
            {items.length > 0 && articleRecommendations.length > 0 && (
              <div
                style={{
                  height: 1,
                  background: T.divider,
                  margin: "16px 0",
                  opacity: 0.5,
                }}
              />
            )}

            {/* Article recommendations */}
            {articleRecommendations.map((article) => (
              <div key={article.slug || article.id} style={{ marginBottom: 12 }}>
                <ArticlePreview
                  article={article}
                  onSelect={(slug) => setSelectedArticle(article)}
                  compact={false}
                />
              </div>
            ))}

            {/* Loading indicator for articles */}
            {articlesLoading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 12px",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: T.grey,
                  opacity: 0.6,
                }}
              >
                <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: GOLD,
                        animation: `ws-dot-pulse 1.4s ease ${i * 0.2}s infinite`,
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </div>
                Loading related articles…
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick View modal */}
      {qvItem && (
        <QuickViewModal
          item={qvItem}
          onClose={() => setQvItem(null)}
          onViewFull={() => setQvItem(null)}
        />
      )}
    </div>
  );
}
