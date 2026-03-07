// ─── src/components/ui/Animations.jsx ─────────────────────────────────────────
// Reusable micro-animation primitives for luxury feel.
// All effects are subtle, performant (GPU-accelerated), and trigger once on scroll.
import { useState, useEffect, useRef } from "react";

// ── useInView — IntersectionObserver hook ────────────────────────────────────
// Returns [ref, inView]. Attach ref to element; inView flips true once visible.
export function useInView({ threshold = 0.15, once = true, rootMargin = "0px" } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) obs.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, inView];
}

// ── CountUp — animated number counter ────────────────────────────────────────
// Counts from 0 → end with easeOutCubic. Triggers when element enters viewport.
export function CountUp({ end, duration = 1600, suffix = "", prefix = "", style }) {
  const [ref, inView] = useInView({ threshold: 0.3 });
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const num = typeof end === "number" ? end : parseInt(end, 10);
    if (isNaN(num) || num === 0) { setCount(end); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setCount(Math.round(eased * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return <span ref={ref} style={style}>{prefix}{count}{suffix}</span>;
}

// ── SplitText — word-by-word reveal ──────────────────────────────────────────
// Each word fades in + slides up with a stagger delay.
// `trigger` prop: pass true to start animation (e.g. from parent's loaded state).
export function SplitText({ children, trigger = true, delay = 0, stagger = 70, style = {} }) {
  const words = String(children).split(/\s+/);

  return (
    <span style={{ display: "inline", ...style }}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: trigger ? 1 : 0,
            transform: trigger ? "translateY(0)" : "translateY(24px)",
            transition: `opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${delay + i * stagger}ms, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${delay + i * stagger}ms`,
            willChange: "transform, opacity",
            // Inherit text styles from parent
            color: "inherit",
            fontStyle: "inherit",
            fontWeight: "inherit",
            letterSpacing: "inherit",
          }}
        >
          {word}{i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

// ── revealStyle — inline stagger style for grid children ─────────────────────
// Use: style={{ ...revealStyle(inView, index) }} on each grid child.
export function revealStyle(visible, index, stagger = 100) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(36px)",
    transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${index * stagger}ms, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${index * stagger}ms`,
  };
}
