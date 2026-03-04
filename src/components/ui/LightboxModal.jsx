import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * LightboxModal — shared, dependency-free overlay.
 *
 * Props
 *   isOpen     {boolean}  show / hide
 *   onClose    {function} called on Escape, backdrop click, or close button
 *   children   {node}     content rendered inside the centred container
 *   maxWidth   {number|string}  optional max-width of content box (default: 920)
 *   bare       {boolean}  if true, skip the white-box wrapper (caller does own layout)
 */
export default function LightboxModal({
  isOpen,
  onClose,
  children,
  maxWidth = 920,
  bare = false,
}) {
  const prevOverflow = useRef("");

  /* ── Scroll lock ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      prevOverflow.current = document.body.style.overflow;
      document.body.classList.add("lwd-scroll-locked");
    }
    return () => {
      document.body.classList.remove("lwd-scroll-locked");
      document.body.style.overflow = prevOverflow.current;
    };
  }, [isOpen]);

  /* ── Escape key ───────────────────────────────────────────────────────── */
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose],
  );
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleKey]);

  /* ── Stop video playback on close ─────────────────────────────────────── */
  const contentRef = useRef(null);
  useEffect(() => {
    if (!isOpen && contentRef.current) {
      contentRef.current.querySelectorAll("video").forEach((v) => {
        v.pause();
        v.currentTime = 0;
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(4,3,2,0.88)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: 20,
        animation: "fadeUp 0.2s ease-out",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(8,6,4,0.7)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "50%",
          color: "#fff",
          fontSize: 18,
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        ×
      </button>

      {/* Content */}
      <div
        ref={contentRef}
        style={
          bare
            ? { maxWidth, width: "100%", maxHeight: "90vh" }
            : {
                maxWidth,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#0f0d0a",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: 12,
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
