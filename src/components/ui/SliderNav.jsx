// ─── src/components/ui/SliderNav.jsx ────────────────────────────────────────
// Reusable horizontal scroll slider wrapper with prev/next nav arrows.
// Wraps children in a scroll container and renders elegant arrow buttons.
import { useRef, useState, useEffect, useCallback } from "react";

const ARROW_STYLE = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 4,
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "rgba(15,13,10,0.72)",
  border: "1px solid rgba(201,168,76,0.25)",
  color: "rgba(255,255,255,0.8)",
  fontSize: 20,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  transition: "all 0.25s",
  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
};

export default function SliderNav({
  children,
  className = "",
  style = {},
  cardWidth = 340,
  gap = 16,
}) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = (cardWidth + gap) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Left arrow */}
      {canLeft && (
        <button
          className="lwd-slider-arrow lwd-slider-arrow-left"
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          style={{ ...ARROW_STYLE, left: 12 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#C9A84C";
            e.currentTarget.style.color = "#C9A84C";
            e.currentTarget.style.background = "rgba(15,13,10,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            e.currentTarget.style.background = "rgba(15,13,10,0.72)";
          }}
        >
          ‹
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={className}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          gap,
          paddingBottom: 8,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          ...style,
        }}
      >
        {children}
      </div>

      {/* Right arrow */}
      {canRight && (
        <button
          className="lwd-slider-arrow lwd-slider-arrow-right"
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          style={{ ...ARROW_STYLE, right: 12 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#C9A84C";
            e.currentTarget.style.color = "#C9A84C";
            e.currentTarget.style.background = "rgba(15,13,10,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            e.currentTarget.style.background = "rgba(15,13,10,0.72)";
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}
